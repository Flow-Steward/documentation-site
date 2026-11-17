// Connected cache-only execution. Contains no inference, process/model launcher,
// test, build, dispatch, rerun, or merge API. Missing proofs never schedule AI.
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {digest, textHash} from './input-identity.mjs';
import {planIncremental} from './incremental-plan.mjs';
import {legacyReceipts} from './legacy-receipts.mjs';
import {openReceiptCache, RECEIPT_BRANCH, coverageRecords, recordCoverage, persistLedger} from './receipt-cache.mjs';
import {githubApi, DOCS_REPO, BRANCH, publishProposal} from './publish.mjs';
import {validateProposal} from './proposal.mjs';
import {evidencePath} from './batches.mjs';

export async function restoreLedger({cacheRoot, api}) {
  const cache = openReceiptCache(cacheRoot);
  const branch = await api('GET', `/repos/${DOCS_REPO}/git/ref/heads/${RECEIPT_BRANCH}`, undefined, true);
  if (!branch) return {cache, head: null};
  const commit = await api('GET', `/repos/${DOCS_REPO}/git/commits/${branch.object.sha}`);
  const tree = await api('GET', `/repos/${DOCS_REPO}/git/trees/${commit.tree.sha}?recursive=1`);
  if (tree.truncated || tree.tree.length > 1100) throw new Error('receipt ledger exceeds restoration bound');
  let bytes = 0;
  for (const file of tree.tree) {
    if (file.type === 'tree') continue;
    if (file.mode !== '100644' || !/^(objects|entries|reservations|dispatches)\/[a-f0-9]{64}\.json$/.test(file.path)) throw new Error('unsupported receipt ledger path');
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > 8 * 1024 * 1024 - bytes) throw new Error('receipt ledger entry exceeds byte bound');
    const blob = await api('GET', `/repos/${DOCS_REPO}/git/blobs/${file.sha}`);
    const content = Buffer.from(blob.content, 'base64'); bytes += content.length;
    if (bytes > 8 * 1024 * 1024) throw new Error('receipt ledger exceeds byte bound');
    writeFileSync(join(cache.root, file.path), content, {flag: 'wx', mode: 0o600});
  }
  return {cache, head: branch.object.sha};
}

export async function prepareConnectedQueue({docsRoot, productRoot, outputRoot, candidateGraphPath, token}) {
  if (existsSync(outputRoot)) throw new Error('refusing to overwrite queue evidence');
  mkdirSync(outputRoot, {recursive: true});
  const api = githubApi(token);
  const report = {version: 1, mode: 'cache_only', model: 'gpt-6-luna', generationAllowed: false, generationTasks: [], status: 'blocked', blockers: []};
  try {
    const {cache, head} = await restoreLedger({cacheRoot: join(outputRoot, 'ledger'), api});
    const candidate = JSON.parse(readFileSync(candidateGraphPath, 'utf8'));
    const plan = planIncremental({docsRoot, productRoot, cacheRoot: cache.root, candidateGraph: candidate, cacheOnly: true, coverage: coverageRecords(cache)});
    report.plan = plan; report.ledgerHead = head;
    if (plan.impact.unresolved.length) report.blockers.push({reason: 'unmapped_or_unreviewed_changes', count: plan.impact.unresolved.length});
    const legacy = legacyReceipts({docsRoot, productRoot, sourceSha: plan.sourceSha, docsSha: plan.docsSha});
    const updates = [], evidence = new Set(), reviews = [], proofs = [], misses = [];
    for (const task of plan.tasks) {
      const cached = task.cached.hit ? task.cached : legacy.lookup(task);
      if (!cached.hit) { misses.push({page: task.path, fingerprint: task.inputs.fingerprint, reason: cached.reason}); continue; }
      const receipt = cached.receipt;
      // Preserve receipt identity. Reuse proof, not relabeling, links old output
      // to the current plan. Generic cache lookup already checked object hashes.
      validateProposal(receipt, docsRoot);
      if (!cached.alreadyApplied) updates.push(...receipt.updates);
      for (const value of receipt.evidence) evidence.add(evidencePath(value));
      reviews.push({path: task.path, summary: receipt.summary, evidence: receipt.evidence});
      proofs.push({page: task.path, proof: cached.proof});
    }
    report.reuseProofs = proofs; report.misses = misses; report.legacyDiagnostics = legacy.diagnostics;
    if (misses.length) report.blockers.push({reason: 'missing_valid_receipts_no_generation_permitted', pages: misses.map(item => item.page)});
    const policy = JSON.parse(readFileSync(join(docsRoot, '.automation/incremental-queue.json'), 'utf8'));
    for (const task of plan.tasks) if (task.inputs.sourceFiles.length > policy.maxSourceFilesPerPage) report.blockers.push({reason: 'read_scope_exceeds_bound', page: task.path});
    // A complete cached run need not obey a budget for NEW calls: it makes zero.
    // A missing result never becomes a successful no-op or partial publication.
    if (!report.blockers.length) {
      if (!plan.tasks.length) report.status = 'no_documentation_required';
      else {
        const proposal = {status: 'completed', summary: `Reused ${proofs.length}/${plan.tasks.length} affected-page receipts. Zero new AI calls. Coverage is public-default only.`, updates, evidence: [...evidence].sort(), reviews};
        validateProposal(proposal, docsRoot);
        const branch = await api('GET', `/repos/${DOCS_REPO}/git/ref/heads/${BRANCH}`, undefined, true);
        const metadata = {sourceSha: plan.sourceSha, docsSha: plan.docsSha, branchSha: branch?.object.sha ?? null, skipTests: true, incremental: true, generationPerformed: false};
        const proposalBytes = JSON.stringify(proposal, null, 2) + '\n';
        report.proposalHash = textHash(proposalBytes);
        writeFileSync(join(outputRoot, 'proposal.json'), proposalBytes, {flag: 'wx'});
        const metadataBytes = JSON.stringify(metadata, null, 2) + '\n';
        report.metadataHash = textHash(metadataBytes);
        writeFileSync(join(outputRoot, 'metadata.json'), metadataBytes, {flag: 'wx'});
        report.status = updates.length ? 'ready_cached_updates' : 'completed_cached_noop';
        report.publish = updates.length > 0;
      }
    }
  } catch (error) { report.blockers.push({reason: error.message}); }
  if (['no_documentation_required', 'completed_cached_noop'].includes(report.status)) {
    report.coverageObject = recordCoverage({root: join(outputRoot, 'ledger')}, {status: report.status, sourceSha: report.plan.sourceSha, docsSha: report.plan.docsSha, coverageInputsHash: report.plan.coverageInputsHash, model: 'gpt-6-luna', reportProofHash: digest(report.reuseProofs ?? [])});
    report.persistCoverage = true;
  }
  report.reportHash = digest(report);
  writeFileSync(join(outputRoot, 'queue.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  return report;
}

export async function publishConnectedQueue({directory, docsRoot, token}) {
  const read = name => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
  const report = read('queue.json'), {reportHash, ...payload} = report;
  if (digest(payload) !== reportHash || report.mode !== 'cache_only' || report.generationAllowed !== false || report.generationTasks.length || !['ready_cached_updates', 'completed_cached_noop', 'no_documentation_required'].includes(report.status) || report.blockers.length) throw new Error('cached queue is not complete and publishable');
  const api = githubApi(token);
  if (report.persistCoverage) {
    openReceiptCache(join(directory, 'ledger'));
    const state = await persistLedger({api, cache: {root: join(directory, 'ledger')}, expectedHead: report.ledgerHead});
    return {coveragePersisted: true, commit: state, noop: true};
  }
  if (textHash(readFileSync(resolve(directory, 'proposal.json'))) !== report.proposalHash || textHash(readFileSync(resolve(directory, 'metadata.json'))) !== report.metadataHash) throw new Error('cached publication payload changed');
  const proposal = read('proposal.json'), metadata = read('metadata.json');
  if (!metadata.incremental || metadata.generationPerformed !== false || metadata.skipTests !== true || metadata.docsSha !== report.plan.docsSha || metadata.sourceSha !== report.plan.sourceSha || report.reuseProofs.length !== report.plan.tasks.length || report.misses.length) throw new Error('cached publication identity differs');
  const changes = validateProposal(proposal, docsRoot);
  return publishProposal({api, metadata, changes, summary: proposal.summary, evidence: proposal.evidence, reviews: proposal.reviews});
}
