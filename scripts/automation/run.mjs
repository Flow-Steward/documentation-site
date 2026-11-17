import {readFileSync, writeFileSync, appendFileSync, statSync, readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {validateProposal} from './proposal.mjs';
import {checkPlan, checkReceipt, combineReceipts} from './batches.mjs';
import {githubApi, publishProposal} from './publish.mjs';

const [action, input, metadataPath, extra, taskId] = process.argv.slice(2);
const gitSha = root => execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
function loadJSON(path, maxBytes = 2 * 1024 * 1024) {
  if (statSync(path).size > maxBytes) throw new Error('automation input exceeds size limit');
  return JSON.parse(readFileSync(path, 'utf8'));
}
function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
if (action === 'prepare-cache-only') {
  const {prepareConnectedQueue} = await import('./connected-queue.mjs');
  if (!input || !metadataPath || !extra) throw new Error('usage: prepare-cache-only <product> <new-output-directory> <candidate-graph>');
  const report = await prepareConnectedQueue({docsRoot: process.cwd(), productRoot: input, outputRoot: metadataPath, candidateGraphPath: extra, token: process.env.GH_TOKEN});
  output('publish', report.publish ? 'true' : 'false');
  output('persist_coverage', report.persistCoverage ? 'true' : 'false');
  output('docs_sha', report.plan?.docsSha ?? gitSha(process.cwd()));
  console.log(`${report.status}; ${report.reuseProofs?.length ?? 0} cached receipts; zero AI calls.`);
  if (report.blockers.length) process.exitCode = 1;
} else if (action === 'publish-cache-only') {
  const {publishConnectedQueue} = await import('./connected-queue.mjs');
  console.log(JSON.stringify(await publishConnectedQueue({directory: input, docsRoot: process.cwd(), token: process.env.GH_TOKEN})));
} else if (action === 'prepare-incremental-queue') {
  if (!input || !metadataPath) throw new Error('usage: prepare-incremental-queue <product-checkout> <new-report.json> [receipt-cache]');
  const {planIncremental} = await import('./incremental-plan.mjs');
  const {prepareWorkQueue} = await import('./work-queue.mjs');
  const root = process.cwd();
  const plan = planIncremental({docsRoot: root, productRoot: input, cacheRoot: extra ?? null});
  const queue = prepareWorkQueue({plan, docsRoot: root,
    dependencies: loadJSON(resolve('.automation/page-dependencies.json')),
    audit: loadJSON(resolve('.automation/dependency-audit.json')),
    policy: loadJSON(resolve('.automation/incremental-queue.json'))});
  writeFileSync(metadataPath, JSON.stringify({plan, queue}, null, 2) + '\n', {flag: 'wx'});
  console.log(`${queue.status}: ${queue.proposedTasks.length} proposed tasks; generation is disabled.`);
  if (queue.status === 'blocked') process.exitCode = 1;
} else if (action === 'plan-incremental') {
  const {planIncremental} = await import('./incremental-plan.mjs');
  if (!input || !metadataPath) throw new Error('usage: plan-incremental <product-checkout> <new-report.json> [receipt-cache]');
  const report = planIncremental({docsRoot: process.cwd(), productRoot: input, cacheRoot: extra ?? null});
  writeFileSync(metadataPath, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.log(`${report.status}: ${report.tasks.length} required pages; ${report.budget.cacheMisses} cache misses. No generation, tests or publication performed.`);
} else if (action === 'prepare') {
  throw new Error('Legacy full-site paid preparation is disabled. Use prepare-cache-only; do not rerun generation.');
} else if (action === 'select-task') {
  const metadata = loadJSON(metadataPath), directory = resolve(metadataPath, '..');
  if (gitSha(process.cwd()) !== metadata.docsSha) throw new Error('checkout differs from documentation base');
  const plan = loadJSON(resolve(directory, 'plan.json'));
  checkPlan(plan, process.cwd(), metadata);
  const task = plan.tasks.find(task => task.id === input);
  if (!task) throw new Error('unknown documentation review task');
  const identity = {
    task_id: task.id, source_sha: metadata.sourceSha, docs_sha: metadata.docsSha,
    reviewed_document: task.path,
  };
  writeFileSync(resolve(directory, 'task.json'), JSON.stringify({
    ...identity, mode: metadata.context.mode,
    changed_paths_file: '../automation-context/changed-paths.txt',
  }, null, 2) + '\n');
  const schema = loadJSON(resolve('.github/codex/proposal.schema.json'));
  for (const [name, value] of Object.entries(identity)) schema.properties[name].enum = [value];
  writeFileSync(resolve(directory, 'task.schema.json'), JSON.stringify(schema, null, 2) + '\n');
} else if (action === 'check-part') {
  const metadata = loadJSON(metadataPath), plan = loadJSON(resolve(metadataPath, '..', 'plan.json'));
  checkPlan(plan, process.cwd(), metadata);
  const task = plan.tasks.find(task => task.id === taskId);
  if (!task || gitSha(process.cwd()) !== metadata.docsSha || gitSha(extra) !== metadata.sourceSha) throw new Error('review checkout or task differs from plan');
  checkReceipt(loadJSON(input), task, metadata, process.cwd(), extra);
  console.log(`Completed review: ${task.path}`);
} else if (action === 'combine') {
  const metadata = loadJSON(metadataPath), plan = loadJSON(resolve(metadataPath, '..', 'plan.json'));
  if (gitSha(process.cwd()) !== metadata.docsSha || gitSha(extra) !== metadata.sourceSha) throw new Error('review aggregation checkout differs from plan');
  const files = readdirSync(input).sort();
  if (files.some(path => !/^proposal-page-[a-f0-9]{16}\.json$/.test(path))) throw new Error('unexpected review artifact file');
  const receipts = files.map(path => loadJSON(resolve(input, path)));
  const proposal = combineReceipts(plan, receipts, metadata, process.cwd(), extra);
  writeFileSync(resolve(input, 'combined.json'), JSON.stringify(proposal, null, 2) + '\n');
  console.log(`Combined ${receipts.length} completed page reviews`);
} else if (action === 'apply' || action === 'publish') {
  const metadata = loadJSON(metadataPath);
  if (gitSha(process.cwd()) !== metadata.docsSha) throw new Error('checkout differs from documentation base');
  const proposal = loadJSON(input);
  const changes = validateProposal(proposal, process.cwd());
  if (action === 'apply') {
    for (const {path, content} of changes) writeFileSync(resolve(path), content);
    console.log(`Validated ${changes.length} changed documentation files`);
  } else {
    const result = await publishProposal({api: githubApi(process.env.GH_TOKEN), metadata, changes, summary: proposal.summary, evidence: proposal.evidence, reviews: proposal.reviews});
    console.log(result.noop ? 'No documentation changes needed; checkpoint unchanged.' : result.html_url);
  }
} else throw new Error('unknown documentation automation action');
