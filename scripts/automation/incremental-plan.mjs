import {readFileSync, readdirSync, lstatSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {checkpoint, SHA} from './proposal.mjs';
import {sourceContext} from './source.mjs';
import {changeSet, digest, gitRead, relativePath, sourceSnapshot, textHash, matchesScope} from './input-identity.mjs';
import {classifyChanges} from './documentation-impact.mjs';
import {resolveImpact, buildPageInputs} from './impact.mjs';
import {lookupReceipt} from './receipt-cache.mjs';
import {validateContractScopes} from './contract-scopes.mjs';
import {expandDeepDependencies} from './deep-dependencies.mjs';
import {currentGraph} from './current-graph.mjs';

function read(root, path) {
  relativePath(path);
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`symlink input: ${path}`);
  }
  if (!lstatSync(current).isFile()) throw new Error('input is not a regular file');
  return readFileSync(current, 'utf8');
}
function documentationInputs(root, rule, page) {
  const inventory = [...new Set(gitRead(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean))].sort();
  return inventory.filter(path => path !== page && (rule.docsScopes ?? []).some(scope => matchesScope(path, scope))).map(path => {
    if (privatePath(path)) throw new Error('private documentation dependency');
    read(root, path); // Validate every path component before reading bytes.
    return {path, sha256: textHash(readFileSync(resolve(root, path)))};
  });
}
function pages(root, path = 'docs') {
  return readdirSync(resolve(root, path), {withFileTypes: true}).flatMap(entry => {
    const name = `${path}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error('symlink documentation inventory');
    return entry.isDirectory() ? pages(root, name) : /\.mdx?$/.test(name) ? [name] : [];
  }).sort();
}
const privatePath = path => /(?:^|\/)(?:\.git|logs|backups|node_modules)(?:\/|$)|(?:^|\/)\.env(?!\.example)(?:[./-]|$)/.test(path);
function verifyDecisionEvidence({rules, productRoot, sourceSha, docsRoot, snapshot}) {
  for (const decision of rules.decisions) {
    for (const evidence of decision.evidence ?? []) {
      relativePath(evidence.path);
      if (privatePath(evidence.path)) throw new Error('private input is not public impact evidence');
      let content;
      if (evidence.kind === 'source') {
        const file = snapshot.find(file => file.path === evidence.path);
        if (!file || file.type !== 'blob' || file.mode === '120000') throw new Error('impact source evidence is missing or unsupported');
        content = gitRead(productRoot, ['show', `${sourceSha}:${evidence.path}`]);
      } else if (evidence.kind === 'documentation') content = read(docsRoot, evidence.path);
      else throw new Error('unsupported impact evidence kind');
      if (textHash(content) !== evidence.sha256) throw new Error(`stale impact decision evidence: ${evidence.path}`);
    }
  }
}

export function planIncremental({docsRoot, productRoot, cacheRoot = null, candidateGraph = null, cacheOnly = false, coverage = []}) {
  const sourceSha = gitRead(productRoot, ['rev-parse', 'HEAD']).trim();
  const docsSha = gitRead(docsRoot, ['rev-parse', 'HEAD']).trim();
  if (!SHA.test(sourceSha) || !SHA.test(docsSha)) throw new Error('invalid planning checkout');
  // Existing ancestry checks remain in force. This path never calls GitHub or
  // generation and never advances the accepted checkpoint.
  const acceptedSha = checkpoint(docsRoot);
  let baseSha = acceptedSha;
  const docsInventory = sourceSnapshot(docsRoot, docsSha);
  const coverageInputsHash = digest(docsInventory.filter(file => !file.path.startsWith('.automation/recovery/')));
  if (cacheOnly) for (const record of coverage) {
    if (record.coverageInputsHash !== coverageInputsHash || !['no_documentation_required', 'completed_cached_noop'].includes(record.status)) continue;
    try {
      sourceContext(productRoot, record.sourceSha, baseSha);
      gitRead(productRoot, ['merge-base', '--is-ancestor', record.sourceSha, sourceSha]);
      baseSha = record.sourceSha;
    } catch { /* Not a reusable ancestor proof; never force/reset a checkpoint. */ }
  }
  sourceContext(productRoot, sourceSha, baseSha);
  const before = baseSha ? sourceSnapshot(productRoot, baseSha) : [];
  const after = sourceSnapshot(productRoot, sourceSha);
  const changes = changeSet(productRoot, baseSha, sourceSha);
  const rules = JSON.parse(read(docsRoot, '.automation/documentation-impact.json'));
  const dependencies = JSON.parse(read(docsRoot, '.automation/page-dependencies.json'));
  validateContractScopes({dependencies, catalog: JSON.parse(read(docsRoot, '.automation/contract-boundaries.json')), external: JSON.parse(read(docsRoot, '.automation/external-contracts.json')), readEvidence: path => read(docsRoot, path)});
  let classification = classifyChanges({baseSha, sourceSha, changes, before, after, rules});
  verifyDecisionEvidence({rules: {...rules, decisions: rules.decisions.filter(decision => decision.changeIdentity === classification.changeIdentity)}, productRoot, sourceSha, docsRoot, snapshot: after});
  let graph = JSON.parse(read(docsRoot, '.automation/deep-dependencies.json'));
  const profile = JSON.parse(read(docsRoot, '.automation/dependency-profile.json'));
  if (candidateGraph) {
    if (!cacheOnly || candidateGraph.sourceSha !== sourceSha) throw new Error('candidate graph differs from source');
    graph = currentGraph({candidate: candidateGraph, reviewed: graph, dependencies, snapshot: after, profile});
  }
  const expandedDependencies = expandDeepDependencies({dependencies, graph, snapshot: after, sourceSha, profile});
  if (cacheOnly) {
    // Mapping is a conservative request for review, never proof of non-impact.
    // Unknown/new areas remain blocked. No commit-message or bugfix-label skips.
    classification = {...classification, items: classification.items.map(item => {
      if (item.outcome !== 'unresolved') return item;
      const paths = [item.change.path, item.change.oldPath].filter(Boolean);
      const mapped = paths.every(path => Object.values(expandedDependencies.pages).some(rule => rule.scopes.some(scope => matchesScope(path, scope))));
      return mapped ? {...item, outcome: 'review_existing_pages', reason: 'Conservative reviewed dependency routing; cache-only execution'} : item;
    })};
  }
  const impact = resolveImpact({classification, dependencies: expandedDependencies, pages: pages(docsRoot)});
  const reviewer = {model: 'gpt-6-luna', mode: 'contract-source-v2', files: {}};
  for (const path of ['.github/codex/documentation.md', '.github/codex/proposal.schema.json', '.github/workflows/update-docs.yml', 'scripts/automation/review-source.mjs', 'scripts/automation/batches.mjs', 'scripts/automation/proposal.mjs', 'scripts/automation/input-identity.mjs', 'scripts/automation/impact.mjs', 'scripts/automation/documentation-impact.mjs', 'scripts/automation/contract-scopes.mjs', 'scripts/automation/deep-dependencies.mjs', 'scripts/automation/current-graph.mjs']) reviewer.files[path] = textHash(read(docsRoot, path));
  const tasks = impact.mandatoryPages.map(page => {
    const rule = expandedDependencies.pages[page];
    const relevantChanges = changes.filter(change => rule.scopes.some(scope => [change.path, change.oldPath].filter(Boolean).some(path => matchesScope(path, scope))));
    const inputs = buildPageInputs({page, pageText: read(docsRoot, page), snapshot: after, beforeSnapshot: before, rule, reviewer, relevantChanges, documentationInputs: documentationInputs(docsRoot, rule, page), releaseFacts: {documentationProfile: profile}});
    if (inputs.sourceFiles.some(file => privatePath(file.path))) throw new Error(`private source scope for ${page}`);
    const cached = cacheRoot && existsSync(resolve(cacheRoot)) ? lookupReceipt({root: resolve(cacheRoot)}, inputs) : {hit: false, reason: 'receipt cache not supplied'};
    return {id: `page-${textHash(page).slice(0, 16)}`, path: page, action: cached.hit ? 'reuse' : 'requires_generation', inputs, cached};
  });
  const misses = tasks.filter(task => !task.cached.hit).length;
  const status = impact.unresolved.length ? 'unresolved' : misses > 10 ? 'blocked_budget' : tasks.length ? 'planned' : 'no_documentation_required';
  return {version: 1, sourceSha, docsSha, baseSha, acceptedSha, coverageInputsHash, status, dependencyProfile: profile, dependencyGraphHash: digest(graph), dependencyReviews: graph.pages.map(({page, closureHash, status, openBoundaries, unresolvedLocalImports}) => ({page, closureHash, status, openBoundaries, unresolvedLocalImports})), classification, impact, tasks,
    budget: {maxNewPages: 10, cacheMisses: misses}, semantic: 'disabled', generationAllowed: false,
    reportHash: digest({classification, impact, tasks, dependencyGraphHash: digest(graph), profile}),
    limitation: 'Offline preflight only. Reviewed dependency/routing decisions and a durable scope-aware execution adapter are required before activation. No checkpoint changed.'};
}
