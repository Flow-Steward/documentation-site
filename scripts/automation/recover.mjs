// Offline recovery of paid page receipts. No API, model, test, or publish calls.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {checkPlan, checkReceipt, combineReceipts, evidencePath} from './batches.mjs';
import {SHA} from './proposal.mjs';

const [directory, productRoot, output] = process.argv.slice(2);
if (!directory || !productRoot || !output) throw new Error('usage: node scripts/automation/recover.mjs <saved-run> <product-checkout> <report.json>');
const root = process.cwd();
const load = path => JSON.parse(readFileSync(resolve(directory, path), 'utf8'));
const git = (cwd, args) => execFileSync('git', args, {cwd, maxBuffer: 4 * 1024 * 1024});
const metadata = load('context/metadata.json'), plan = load('context/plan.json');
if (!SHA.test(metadata.docsSha) || !SHA.test(metadata.sourceSha)) throw new Error('invalid saved review identity');
if (git(productRoot, ['rev-parse', 'HEAD']).toString().trim() !== metadata.sourceSha) throw new Error('product checkout differs from saved source');
git(productRoot, ['diff', '--exit-code', 'HEAD', '--']);
checkPlan(plan, root, metadata);
// Automation-only fixes may change HEAD, but reviewed inputs must be byte-exact.
for (const path of [...plan.tasks.map(task => task.path), '.automation/docs-source.json']) {
  if (!git(root, ['show', `${metadata.docsSha}:${path}`]).equals(readFileSync(resolve(root, path)))) throw new Error(`review input changed since saved run: ${path}`);
}
const files = readdirSync(resolve(directory, 'receipts')).sort();
if (files.some(path => !/^proposal-page-[a-f0-9]{16}\.json$/.test(path))) throw new Error('unexpected receipt filename');
const byId = new Map(), records = [];
for (const file of files) {
  const bytes = readFileSync(resolve(directory, 'receipts', file));
  const receipt = JSON.parse(bytes);
  const task = plan.tasks.find(task => task.id === receipt.task_id);
  if (!task || file !== `proposal-${task.id}.json` || byId.has(task.id)) throw new Error('unknown, misnamed, or duplicate saved receipt');
  const record = {taskId: task.id, path: task.path, sha256: createHash('sha256').update(bytes).digest('hex')};
  try {
    checkReceipt(receipt, task, metadata, root, productRoot);
    record.reusable = true;
    // Derived values only: original receipt and explanatory citations stay intact.
    record.normalizedEvidence = receipt.evidence.map(evidencePath);
  } catch (error) {
    record.reusable = false;
    record.error = error.message;
  }
  records.push(record);
  byId.set(task.id, receipt);
}
const missing = plan.tasks.filter(task => !byId.has(task.id));
const complete = !missing.length && records.every(record => record.reusable);
const report = {
  sourceSha: metadata.sourceSha, docsSha: metadata.docsSha,
  status: complete ? 'completed' : 'incomplete', planned: plan.tasks.length,
  saved: records.length, reusable: records.filter(record => record.reusable).length,
  missing, receipts: records,
};
// Aggregate/publication payloads are never produced from partial receipts.
if (complete) report.proposal = combineReceipts(plan, [...byId.values()], metadata, root, productRoot);
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(`Saved ${report.saved}/${report.planned}; reusable ${report.reusable}; ${report.status}. No generation or publication performed.`);
