import {digest, matchesScope, relativePath, scopePath, scopeInventory, textHash, byPath} from './input-identity.mjs';

export function resolveImpact({classification, dependencies, pages}) {
  if (dependencies.version !== 1 || !dependencies.pages || typeof dependencies.pages !== 'object') throw new Error('unsupported dependency map');
  const inventory = new Set(pages);
  for (const page of pages) if (!Object.hasOwn(dependencies.pages, page)) throw new Error(`documentation page is missing a dependency entry: ${page}`);
  for (const [page, rule] of Object.entries(dependencies.pages)) {
    relativePath(page);
    if (!inventory.has(page) || !Array.isArray(rule.scopes)) throw new Error(`stale or invalid page dependency: ${page}`);
    rule.scopes.forEach(scopePath);
    if (!Array.isArray(rule.readScopes)) throw new Error(`missing contract read scopes: ${page}`);
    rule.readScopes.forEach(scopePath);
    if (rule.docsScopes !== undefined) {
      if (!Array.isArray(rule.docsScopes)) throw new Error('invalid documentation dependency scopes');
      rule.docsScopes.forEach(scopePath);
    }
  }
  const mandatory = new Set(), newDocCandidates = [], unresolved = [], reasons = [];
  for (const item of classification.items) {
    if (item.outcome === 'no_documentation_required') { reasons.push(item); continue; }
    const paths = [item.change.path, item.change.oldPath].filter(Boolean);
    const candidates = Object.entries(dependencies.pages).filter(([, rule]) => rule.scopes.some(scope => paths.some(path => matchesScope(path, scope))));
    const approved = candidates.filter(([, rule]) => rule.reviewed === true && rule.reviewedBy?.trim() && rule.reason?.trim());
    approved.forEach(([page]) => mandatory.add(page));
    reasons.push({change: item.change, candidates: candidates.map(([page]) => page), approved: approved.map(([page]) => page)});
    if (item.outcome === 'possible_new_documentation') newDocCandidates.push(item);
    // Mapped paths alone do not establish documented impact or completeness.
    if (item.outcome === 'unresolved' || item.outcome === 'possible_new_documentation' || !approved.length || candidates.length !== approved.length || !paths.every(path => approved.some(([, rule]) => rule.scopes.some(scope => matchesScope(path, scope))))) unresolved.push(item);
  }
  return {mandatoryPages: [...mandatory].sort(), newDocCandidates, unresolved, reasons, dependencyHash: digest(dependencies)};
}

export function buildPageInputs({page, pageText, snapshot, beforeSnapshot, rule, reviewer, relevantChanges, documentationInputs = [], releaseFacts = {}}) {
  if (reviewer.model !== 'gpt-6-luna') throw new Error('receipt inputs require exactly gpt-6-luna');
  if (!rule?.reviewed || !rule.reviewedBy?.trim() || !rule.reason?.trim() || !(rule.scopes?.length || rule.docsScopes?.length)) throw new Error(`dependency scope is not reviewed: ${page}`);
  const sourceScopes = scopeInventory(snapshot, rule.scopes);
  if (!Array.isArray(rule.readScopes)) throw new Error('contract read scopes are required');
  const readSourceScopes = scopeInventory(snapshot, rule.readScopes);
  const watched = new Map(sourceScopes.flatMap(scope => scope.files).map(file => [file.path, file]));
  // Include both rename sides when present; deleted content stays in the before
  // inventory. Unknown changes must be resolved by the impact filter first.
  const changed = new Set(relevantChanges.flatMap(change => [change.path, change.oldPath].filter(Boolean)));
  const readFiles = readSourceScopes.flatMap(scope => scope.files);
  if (readFiles.some(file => !watched.has(file.path))) throw new Error('contract read scope is outside watched dependencies');
  const sourceFiles = [...new Map([...readFiles, ...[...watched.values()].filter(file => changed.has(file.path))].map(file => [file.path, file])).values()].sort(byPath);
  if (sourceFiles.some(file => file.type !== 'blob' || file.mode === '120000')) throw new Error('review scope includes a symlink or submodule');
  // Audit revision and reviewer attribution are provenance, not reusable content inputs.
  const {reviewSourceSha: _reviewSourceSha, reviewedBy: _reviewedBy, ...inputRule} = rule;
  const context = {version: 3, page: relativePath(page), sourceScopes, readSourceScopes, previousSourceScopes: scopeInventory(beforeSnapshot, rule.scopes), documentationInputs, rule: inputRule, reviewer, relevantChanges, releaseFacts};
  const contextHash = digest(context), pageHash = textHash(pageText);
  return {version: 1, page, pageHash, contextHash, fingerprint: digest({contextHash, pageHash}), sourceFiles, context};
}
