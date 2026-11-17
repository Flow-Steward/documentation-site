// Saved static graph only: no imports of product code, subprocesses or models.
import {digest, matchesScope, relativePath, scopePath} from './input-identity.mjs';

export function expandDeepDependencies({dependencies, graph, snapshot, sourceSha, profile}) {
  if (profile.version !== 1 || profile.id !== 'public-default-v1' || profile.model !== 'gpt-6-luna' || profile.generationEnabled !== false || profile.chromaEnabled !== false || graph.profileHash !== digest(profile) || graph.coverageProfile !== profile.id) throw new Error('unsupported or stale dependency coverage profile');
  if (graph.version !== 1 || graph.sourceSha !== sourceSha || graph.parseErrors.length) throw new Error('deep dependency graph needs source review');
  const paths = new Set(snapshot.map(file => file.path));
  for (const [path, targets] of Object.entries(graph.edges)) {
    relativePath(path);
    if (!paths.has(path) || !Array.isArray(targets)) throw new Error('invalid dependency graph node');
    for (const target of targets) if (!paths.has(relativePath(target))) throw new Error('missing deep dependency target');
  }
  const entries = new Map();
  for (const entry of graph.pages) {
    if (entries.has(entry.page)) throw new Error('duplicate deep dependency page');
    entries.set(entry.page, entry);
  }
  if (entries.size !== Object.keys(dependencies.pages).length || [...entries.keys()].some(page => !Object.hasOwn(dependencies.pages, page))) throw new Error('deep dependency inventory differs');
  const pages = {};
  for (const [page, rule] of Object.entries(dependencies.pages)) {
    rule.scopes.forEach(scopePath);
    const seen = new Set([...paths].filter(path => rule.scopes.some(scope => matchesScope(path, scope))));
    const roots = new Set(seen);
    const pending = [...seen];
    while (pending.length) for (const target of graph.edges[pending.pop()] ?? []) {
      if (!seen.has(target)) { seen.add(target); pending.push(target); }
    }
    const closed = [...seen].sort();
    const entry = entries.get(page);
    if (!entry || digest(closed) !== entry.closureHash || rule.deepClosureHash !== entry.closureHash || rule.dependencyProfileHash !== digest(profile) || entry.openBoundaries.length || entry.status !== 'static_imports_accounted') throw new Error(`stale deep closure: ${page}`);
    // Full graph hash is report provenance. Per-page identity binds only its
    // reachable scope list and actual Git inventories, avoiding global misses.
    pages[page] = {...rule, scopes: [...new Set([...rule.scopes, ...closed.filter(path => !roots.has(path))])].sort()};
  }
  return {...dependencies, pages};
}
