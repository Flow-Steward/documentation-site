// Static configuration consistency only. Does not approve semantic completeness.
import {digest, scopePath, textHash} from './input-identity.mjs';

export function validateContractScopes({dependencies, catalog, external, readEvidence}) {
  if (catalog.version !== 1 || catalog.model !== 'gpt-6-luna' || catalog.mode !== 'watch-and-contract-read' || external.version !== 1) throw new Error('unsupported contract catalog');
  const contains = (list, items) => items.every(item => list.includes(item));
  for (const [page, rule] of Object.entries(dependencies.pages)) {
    if (!Array.isArray(rule.readScopes) || !Array.isArray(rule.contracts) || !Array.isArray(rule.externalReferences)) throw new Error(`missing contract boundary: ${page}`);
    rule.readScopes.forEach(scopePath);
    if (new Set(rule.topics).size !== rule.topics.length || rule.contracts.length !== rule.topics.length) throw new Error('contract inventory differs');
    const reads = new Set();
    for (const topic of rule.topics) {
      const boundary = catalog.boundaries[topic];
      const {reviewSourceSha: _provenance, ...contentBoundary} = boundary ?? {};
      const contracts = rule.contracts.filter(item => item.topic === topic);
      if (!boundary || contracts.length !== 1 || contracts[0].boundaryHash !== digest(contentBoundary) || contracts[0].contract !== boundary.contract || !contains(rule.scopes, boundary.watchScopes)) throw new Error(`stale contract boundary: ${page}/${topic}`);
      boundary.readScopes.forEach(scope => reads.add(scope));
    }
    const expected = rule.topics.length ? [...reads].sort() : [...rule.scopes].sort();
    if (digest(expected) !== digest([...rule.readScopes].sort())) throw new Error(`read contract differs: ${page}`);
    if (rule.externalDependencies.length !== rule.externalReferences.length) throw new Error('external reference inventory differs');
    const expectedEvidence = new Set();
    for (const url of rule.externalDependencies) {
      const refs = rule.externalReferences.filter(ref => ref.url === url);
      if (refs.length !== 1) throw new Error('duplicate or missing external reference');
      const ref = refs[0];
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const repository = `${segments[0]}/${(segments[1] ?? '').replace(/\.git$/, '')}`;
      if (parsed.origin !== 'https://github.com' || segments[0] !== 'Flow-Steward' || repository !== ref.repository) throw new Error('external repository identity differs');
      const source = Object.values(external.repositories).find(item => item.repository === ref.repository);
      if (!source || source.revision !== ref.revision || ref.snapshotHash !== digest(source) || source.status !== 'pinned_reference') throw new Error(`unresolved external reference: ${page}`);
      for (const file of source.files) {
        const path = `.automation/external-evidence/${segments[1].replace(/\.git$/, '')}/${file.path}`;
        scopePath(path);
        expectedEvidence.add(path);
        if (typeof readEvidence !== 'function' || textHash(readEvidence(path)) !== file.sha256) throw new Error(`external evidence differs: ${path}`);
      }
    }
    if (!Array.isArray(rule.externalEvidenceInputs) || digest([...expectedEvidence].sort()) !== digest(rule.externalEvidenceInputs) || !contains(rule.docsScopes, [...expectedEvidence])) throw new Error('external evidence inputs differ');
  }
}
