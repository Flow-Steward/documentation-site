// Refresh topology as data. Reviewed dynamic boundaries may only be carried
// forward when their defining public source bytes are unchanged.
import {digest, matchesScope} from './input-identity.mjs';

export function currentGraph({candidate, reviewed, dependencies, snapshot, profile}) {
  if (candidate.version !== 1 || !candidate.dynamicSites || !candidate.unresolvedLocalImports || candidate.parseErrors.length || reviewed.profileHash !== digest(profile)) throw new Error('source graph requires review');
  const graph = structuredClone(candidate);
  const paths = new Set(snapshot.map(file => file.path));
  const resolver = 'core/application/orchestration/tools/tool_resolver.py';
  if (graph.edges[resolver]) graph.edges[resolver] = [...new Set([...graph.edges[resolver], ...[...paths].filter(path => path.startsWith('core/application/orchestration/tools/') || path.startsWith('core/infrastructure/static_catalog/'))])].sort();
  for (const entry of graph.pages) {
    const rule = dependencies.pages[entry.page];
    if (!rule) throw new Error('unmapped documentation page');
    const roots = new Set([...paths].filter(path => rule.scopes.some(scope => matchesScope(path, scope))));
    const seen = new Set(roots), pending = [...roots];
    while (pending.length) for (const path of graph.edges[pending.pop()] ?? []) if (!seen.has(path)) { seen.add(path); pending.push(path); }
    const open = [];
    for (const path of Object.keys(graph.dynamicSites ?? {}).filter(path => seen.has(path))) {
      const decision = reviewed.dynamicResolutions[path];
      if (!decision || decision.sourceSha256 !== graph.sourceEvidence[path] || !['resolved', 'resolved_public_default', 'resolved_public_profile_boundary'].includes(decision.status)) open.push(path);
    }
    for (const [path, imports] of Object.entries(graph.unresolvedLocalImports ?? {}).filter(([path]) => seen.has(path))) {
      const exception = reviewed.staticExceptions.find(item => item.path === path && item.kind === 'stale_type_only_import' && item.sourceSha256 === graph.sourceEvidence[path]);
      if (!exception || imports.some(item => item.module !== exception.module)) open.push(path);
    }
    if (open.length) throw new Error(`Changed or unknown dynamic/import contracts require review: ${[...new Set(open)].join(', ')}`);
    entry.closureHash = digest([...seen].sort());
    entry.openBoundaries = []; entry.status = 'static_imports_accounted';
    entry.unresolvedLocalImports = {}; entry.additionalWatchFiles = seen.size - roots.size;
    rule.deepClosureHash = entry.closureHash;
  }
  graph.profileHash = digest(profile); graph.coverageProfile = profile.id;
  return graph;
}
