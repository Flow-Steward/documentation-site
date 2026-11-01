import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {SHA, validateProposal} from './proposal.mjs';

const PAGE_LIMIT = 96 * 1024;
const TASK_LIMIT = 200; // Below GitHub's matrix limit; never silently drop pages.
const DOC_PATH = /^docs\/[a-zA-Z0-9_/-]+\.mdx?$/;

function pages(root, directory = 'docs') {
  const result = [];
  for (const entry of readdirSync(join(root, directory), {withFileTypes: true})) {
    const path = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`symlink in documentation tree: ${path}`);
    if (entry.isDirectory()) result.push(...pages(root, path));
    else if (/\.mdx?$/.test(entry.name)) {
      if (!DOC_PATH.test(path) || !entry.isFile()) throw new Error(`unsupported documentation page: ${path}`);
      if (lstatSync(join(root, path)).size > PAGE_LIMIT) throw new Error(`page exceeds ${PAGE_LIMIT} bytes; split it explicitly: ${path}`);
      result.push(path);
    }
  }
  return result.sort();
}

export function reviewPlan(root, metadata) {
  if (!SHA.test(metadata.sourceSha) || !SHA.test(metadata.docsSha)) throw new Error('invalid review identity');
  const documents = pages(root);
  if (!documents.length || documents.length > TASK_LIMIT) throw new Error('documentation task count is outside supported limits');
  return {
    version: 1, sourceSha: metadata.sourceSha, docsSha: metadata.docsSha,
    tasks: documents.map(path => ({id: `page-${createHash('sha256').update(path).digest('hex').slice(0, 16)}`, path})),
  };
}

export function checkPlan(plan, root, metadata) {
  if (JSON.stringify(plan) !== JSON.stringify(reviewPlan(root, metadata))) throw new Error('review plan differs from the trusted documentation inventory');
}

function checkEvidence(evidence, productRoot) {
  for (const path of evidence) {
    if (!/^[a-zA-Z0-9_.@/-]+$/.test(path) || path.startsWith('/') || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('evidence must name an existing path relative to the public product');
    let current = productRoot;
    for (const part of path.split('/')) {
      current = join(current, part);
      if (!existsSync(current) || lstatSync(current).isSymbolicLink()) throw new Error(`missing or symlink source evidence: ${path}`);
    }
    if (!lstatSync(current).isFile()) throw new Error('source evidence must be a file');
  }
}

export function checkReceipt(receipt, task, metadata, root, productRoot) {
  if (!receipt || receipt.task_id !== task.id || receipt.source_sha !== metadata.sourceSha || receipt.docs_sha !== metadata.docsSha || receipt.reviewed_document !== task.path) throw new Error(`review receipt identity differs: ${task.id}`);
  // Validate status before considering empty updates: an abandoned review is not a no-op.
  const changes = validateProposal(receipt, root);
  if (receipt.updates.some(update => update.path !== task.path)) throw new Error(`review modified another task's page: ${task.id}`);
  checkEvidence(receipt.evidence, productRoot);
  return changes;
}

export function combineReceipts(plan, receipts, metadata, root, productRoot) {
  checkPlan(plan, root, metadata);
  if (!Array.isArray(receipts) || receipts.length !== plan.tasks.length) throw new Error('missing or extra review receipts; partial publication is forbidden');
  const byId = new Map();
  for (const receipt of receipts) {
    if (!receipt || byId.has(receipt.task_id)) throw new Error('duplicate review receipt');
    byId.set(receipt.task_id, receipt);
  }
  const updates = [], evidence = new Set(), reviews = [];
  for (const task of plan.tasks) {
    const receipt = byId.get(task.id);
    const changes = checkReceipt(receipt, task, metadata, root, productRoot);
    updates.push(...changes.map(({path, content}) => ({path, content})));
    receipt.evidence.forEach(path => evidence.add(path));
    reviews.push({path: task.path, summary: receipt.summary, evidence: receipt.evidence});
  }
  const proposal = {
    status: 'completed',
    summary: `Completed ${plan.tasks.length}/${plan.tasks.length} page-scoped reviews against public source ${metadata.sourceSha}. ${updates.length} documentation pages changed. All receipts completed; no partial results were published.`,
    evidence: [...evidence].sort(), updates, reviews,
  };
  validateProposal(proposal, root); // Enforce the existing aggregate size/path limits too.
  return proposal;
}
