import {digest, matchesScope, scopePath} from './input-identity.mjs';

const OUTCOMES = new Set(['no_documentation_required', 'review_existing_pages', 'possible_new_documentation', 'unresolved']);
export function classifyChanges({baseSha, sourceSha, changes, before, after, rules}) {
  if (rules.version !== 1 || !Array.isArray(rules.decisions)) throw new Error('unsupported impact policy');
  const changeIdentity = digest({baseSha, sourceSha, changes, before, after});
  const policyHash = digest(rules);
  const decisions = rules.decisions.filter(decision => decision.changeIdentity === changeIdentity);
  for (const decision of decisions) {
    if (!OUTCOMES.has(decision.outcome) || !decision.reviewedBy?.trim() || !decision.reason?.trim() || !Array.isArray(decision.scopes) || !decision.scopes.length || !Array.isArray(decision.evidence) || !decision.evidence.length) throw new Error('impact decision lacks review, scope, reason or evidence');
    decision.scopes.forEach(scopePath);
    for (const evidence of decision.evidence) {
      // Content-bound public evidence, not free-form claims or commit labels.
      if (!['source', 'documentation'].includes(evidence.kind) || !evidence.path || !/^[a-f0-9]{64}$/.test(evidence.sha256)) throw new Error('impact evidence must bind a public file hash');
    }
  }
  const items = changes.map(change => {
    const paths = [change.path, change.oldPath].filter(Boolean);
    // A rename must have a decision covering both paths, not just its old name.
    const matching = decisions.filter(decision => paths.every(path => decision.scopes.some(scope => matchesScope(path, scope))));
    if (matching.length > 1) throw new Error('overlapping reviewed impact decisions');
    const decision = matching[0];
    return {change, outcome: decision?.outcome ?? 'unresolved', reason: decision?.reason ?? 'No content-bound reviewed impact decision', decision: decision ?? null};
  });
  return {version: 1, baseSha, sourceSha, changeIdentity, policyHash, items};
}
