// Pure preparation contract. This module cannot invoke a model or dispatch work.
import {readFileSync, lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {digest, textHash} from './input-identity.mjs';

export function prepareWorkQueue({plan, dependencies, audit, policy, docsRoot}) {
  if (policy.version !== 1 || policy.model !== 'gpt-6-luna' || policy.mode !== 'planning_only' || policy.generationEnabled !== false) throw new Error('queue preparation requires disabled generation and Luna');
  if (!Number.isSafeInteger(policy.maxNewPages) || policy.maxNewPages < 1 || !Number.isSafeInteger(policy.maxSourceFilesPerPage) || policy.maxSourceFilesPerPage < 1) throw new Error('invalid queue bounds');
  const blockers = [];
  const currentPages = Object.keys(dependencies.pages).sort();
  const entries = new Map();
  const graphReviews = new Map((plan.dependencyReviews ?? []).map(entry => [entry.page, entry]));
  if (audit.version !== 1 || !Array.isArray(audit.pages)) throw new Error('invalid dependency audit');
  if (!plan.dependencyGraphHash || audit.deepGraphHash !== plan.dependencyGraphHash) blockers.push({reason: 'deep_dependency_graph_is_stale'});
  if (!plan.dependencyProfile || policy.coverageProfile !== plan.dependencyProfile.id || audit.coverageProfile !== plan.dependencyProfile.id || audit.profileHash !== digest(plan.dependencyProfile)) blockers.push({reason: 'dependency_coverage_profile_differs'});
  if (audit.sourceSha !== plan.sourceSha) blockers.push({reason: 'source_changed_since_dependency_audit'});
  for (const entry of audit.pages) {
    if (entries.has(entry.page)) throw new Error('duplicate page audit');
    entries.set(entry.page, entry);
  }
  if (entries.size !== currentPages.length || [...entries.keys()].some(page => !Object.hasOwn(dependencies.pages, page))) blockers.push({reason: 'audit_inventory_differs'});
  for (const page of currentPages) {
    const entry = entries.get(page), rule = dependencies.pages[page];
    if (!entry || entry.scopeHash !== digest(rule)) blockers.push({page, reason: 'dependency_audit_is_stale'});
    const path = resolve(docsRoot, page);
    if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) throw new Error('queue page is not a regular file');
    if (!entry || entry.pageHash !== textHash(readFileSync(path))) blockers.push({page, reason: 'page_changed_since_scope_review'});
    if (!rule.reviewed || !rule.reviewedBy?.trim() || entry?.status !== 'approved' || audit.status !== 'approved') blockers.push({page, reason: 'dependency_completeness_not_approved'});
    if (!entry?.contractBoundaryReview || Object.keys(entry.contractBoundaryReview.unresolvedDirectImports ?? {}).length) blockers.push({page, reason: 'contract_boundary_review_incomplete'});
    const graphReview = graphReviews.get(page);
    if (!graphReview || graphReview.closureHash !== entry?.deepReview?.closureHash || digest(graphReview.openBoundaries) !== digest(entry?.deepReview?.openBoundaries ?? []) || graphReview.status !== entry?.deepReview?.status || digest(graphReview.unresolvedLocalImports) !== digest(entry?.deepReview?.unresolvedLocalImports ?? {})) blockers.push({page, reason: 'deep_review_disposition_differs'});
    // Historical graph counts remain evidence; explicit current dispositions
    // replace the blanket counter gate. Unknown boundaries still block.
    if (!entry?.deepReview || entry.deepReview.profileHash !== rule.dependencyProfileHash || entry.deepReview.closureHash !== rule.deepClosureHash || !['static_imports_accounted', 'static_imports_accounted_with_open_boundaries'].includes(entry.deepReview.status)) blockers.push({page, reason: 'deep_dependency_review_missing'});
    if (entry?.deepReview?.openBoundaries?.length) blockers.push({page, reason: 'runtime_selected_modules_require_bounded_inputs', boundaries: entry.deepReview.openBoundaries});
    if (Object.keys(entry?.deepReview?.unresolvedLocalImports ?? {}).length || entry?.localLinkGaps?.length) blockers.push({page, reason: 'dependency_edges_require_resolution'});
    if (entry?.deepReview?.externalReferencesPending || entry?.externalDependencies?.length) blockers.push({page, reason: 'external_reference_executor_not_connected'});
  }
  if (plan.status === 'unresolved' || plan.impact.unresolved.length) blockers.push({reason: 'unresolved_documented_impact', changes: plan.impact.unresolved.length});
  for (const task of plan.tasks) {
    const taskProfile = task.inputs.context.releaseFacts?.documentationProfile;
    if (!taskProfile || digest(taskProfile) !== digest(plan.dependencyProfile) || task.inputs.context.rule.dependencyProfileHash !== digest(taskProfile)) blockers.push({page: task.path, reason: 'task_coverage_profile_differs'});
  }
  const proposed = plan.tasks.map(task => ({id: task.id, page: task.path, fingerprint: task.inputs.fingerprint, action: task.cached.hit ? 'reuse' : 'requires_generation', sourceFiles: task.inputs.sourceFiles.length, proof: task.cached.proof ?? null}));
  for (const task of proposed) if (task.sourceFiles > policy.maxSourceFilesPerPage) blockers.push({page: task.page, reason: 'source_scope_exceeds_queue_bound', files: task.sourceFiles});
  const misses = proposed.filter(task => task.action === 'requires_generation').length;
  if (misses > policy.maxNewPages) blockers.push({reason: 'new_page_budget_exceeded', misses});
  const noDocumentation = plan.status === 'no_documentation_required' && plan.classification.items.every(item => item.outcome === 'no_documentation_required');
  // Complete content-bound non-impact evidence does not need an embedding index
  // or generation queue. This record is still not a published-site checkpoint.
  const status = blockers.length ? 'blocked' : noDocumentation ? 'no_documentation_required' : 'prepared_disabled';
  const result = {version: 1, sourceSha: plan.sourceSha, docsSha: plan.docsSha, planHash: plan.reportHash,
    status, coverageProfile: plan.dependencyProfile, customPrivateBehaviorCovered: false, proposedNoDocumentation: noDocumentation, mode: policy.mode, model: policy.model, generationAllowed: false, chromaEnabled: false,
    proposedTasks: proposed, generationTasks: [], reuseTasks: blockers.length ? [] : proposed.filter(task => task.action === 'reuse'),
    blockers, activationRequired: status !== 'no_documentation_required'};
  return {...result, queueHash: digest(result)};
}
