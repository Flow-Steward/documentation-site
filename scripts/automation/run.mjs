import {readFileSync, writeFileSync, appendFileSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {checkpoint, SHA, validateProposal} from './proposal.mjs';
import {sourceContext} from './source.mjs';
import {githubApi, publishProposal, DOCS_REPO, BRANCH} from './publish.mjs';

const [action, input, metadataPath] = process.argv.slice(2);
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
  output('source_sha', sourceSha); output('docs_sha', docsSha);
  output('needed', context.mode === 'unchanged' ? 'false' : 'true');
  console.log(`Documentation context: ${context.mode}, ${context.changedPaths.length} source paths`);
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
} else throw new Error('expected prepare, apply or publish');
