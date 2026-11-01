import {readFileSync, writeFileSync, appendFileSync, statSync, readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {checkpoint, SHA, validateProposal} from './proposal.mjs';
import {sourceContext} from './source.mjs';
import {reviewPlan, checkPlan, checkReceipt, combineReceipts} from './batches.mjs';
import {githubApi, publishProposal, DOCS_REPO, BRANCH} from './publish.mjs';

const [action, input, metadataPath, extra, taskId] = process.argv.slice(2);
const gitSha = root => execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
function loadJSON(path, maxBytes = 2 * 1024 * 1024) {
  if (statSync(path).size > maxBytes) throw new Error('automation input exceeds size limit');
  return JSON.parse(readFileSync(path, 'utf8'));
}
function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
if (action === 'prepare') {
  const root = process.cwd();
  const sourceSha = gitSha(input), docsSha = gitSha(root);
  if (!SHA.test(sourceSha) || !SHA.test(docsSha)) throw new Error('invalid checkout SHA');
  const requested = process.env.REQUESTED_SOURCE_SHA;
  if (requested) sourceContext(input, requested, null);
  const context = sourceContext(input, sourceSha, checkpoint(root));
  const api = githubApi(process.env.GH_TOKEN);
  const branch = await api('GET', `/repos/${DOCS_REPO}/git/ref/heads/${BRANCH}`, undefined, true);
  const metadata = {sourceSha, docsSha, branchSha: branch?.object.sha ?? null, context};
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
  const directory = resolve(metadataPath, '..');
  const plan = reviewPlan(root, metadata);
  writeFileSync(resolve(directory, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  writeFileSync(resolve(directory, 'changed-paths.txt'), context.changedPaths.join('\n') + '\n');
  output('tasks', JSON.stringify(plan.tasks.map(task => task.id)));
  output('source_sha', sourceSha); output('docs_sha', docsSha);
  output('needed', context.mode === 'unchanged' ? 'false' : 'true');
  console.log(`Documentation context: ${context.mode}, ${context.changedPaths.length} source paths`);
} else if (action === 'select-task') {
  const metadata = loadJSON(metadataPath), directory = resolve(metadataPath, '..');
  if (gitSha(process.cwd()) !== metadata.docsSha) throw new Error('checkout differs from documentation base');
  const plan = loadJSON(resolve(directory, 'plan.json'));
  checkPlan(plan, process.cwd(), metadata);
  const task = plan.tasks.find(task => task.id === input);
  if (!task) throw new Error('unknown documentation review task');
  writeFileSync(resolve(directory, 'task.json'), JSON.stringify({
    task_id: task.id, source_sha: metadata.sourceSha, docs_sha: metadata.docsSha,
    reviewed_document: task.path, mode: metadata.context.mode,
    changed_paths_file: '../automation-context/changed-paths.txt',
  }, null, 2) + '\n');
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
    const result = await publishProposal({api: githubApi(process.env.GH_TOKEN), metadata, changes, summary: proposal.summary, evidence: proposal.evidence});
    console.log(result.noop ? 'No documentation changes needed; checkpoint unchanged.' : result.html_url);
  }
} else throw new Error('unknown documentation automation action');
