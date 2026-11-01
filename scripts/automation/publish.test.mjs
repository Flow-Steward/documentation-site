import test from 'node:test';
import assert from 'node:assert/strict';
import {publishProposal} from './publish.mjs';

const main = 'a'.repeat(40), source = 'b'.repeat(40), old = 'c'.repeat(40);
const metadata = {docsSha: main, sourceSha: source, branchSha: null};
function fixture({head = null, mainSha = main, human = false, existingPR = null} = {}) {
  const mutations = [];
  const api = async (method, path, body) => {
    if (method !== 'GET') mutations.push({method, path, body});
    if (path.endsWith('/git/ref/heads/main')) return {object: {sha: mainSha}};
    if (path.endsWith('/git/ref/heads/codex/documentation-sync')) return head ? {object: {sha: head}} : null;
    if (path.includes('/git/commits/')) return {tree: {sha: 'base-tree'}, message: human ? 'Human changes' : 'docs: synchronize public source ' + source, author: {email: '41898282+github-actions[bot]@users.noreply.github.com'}};
    if (path.includes('/pulls?')) return existingPR ? [existingPR] : [];
    if (path.endsWith('/git/trees')) return {sha: 'tree'};
    if (path.endsWith('/git/commits')) return {sha: 'd'.repeat(40)};
    if (path.endsWith('/pulls') || path.endsWith('/pulls/7')) return {number: 7, html_url: 'https://github.com/Flow-Steward/documentation-site/pull/7'};
    return {};
  };
  return {api, mutations};
}
const changes = [{path: 'docs/user/workflows.md', mode: '100644', type: 'blob', content: 'updated'}];
test('creates a documentation branch and PR with source evidence', async () => {
  const f = fixture();
  const result = await publishProposal({...f, metadata, changes, summary: 'Updated workflows', evidence: ['core/example.py']});
  assert.equal(result.number, 7);
  const tree = f.mutations.find(x => x.path.endsWith('/git/trees')).body;
  assert.equal(tree.base_tree, 'base-tree');
  assert.equal(tree.tree[1].path, '.automation/docs-source.json');
  assert.equal(f.mutations.find(x => x.path.endsWith('/pulls')).body.base, 'main');
  assert.match(f.mutations.find(x => x.path.endsWith('/pulls')).body.body, /bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/);
});
test('no-op never writes a branch or advances a checkpoint', async () => {
  const f = fixture();
  assert.deepEqual(await publishProposal({...f, metadata, changes: [], summary: 'No change', evidence: ['core/example.py']}), {noop: true});
  assert.deepEqual(f.mutations, []);
});
test('product reversion withdraws stale pending changes without advancing the checkpoint', async () => {
  const f = fixture({head: old, existingPR: {number: 7, state: 'open'}});
  const result = await publishProposal({...f, metadata: {...metadata, branchSha: old}, changes: [], summary: 'Feature was reverted; current docs need no updates', evidence: ['core/example.py']});
  assert.equal(result.noop, true);
  const commit = f.mutations.find(x => x.path.endsWith('/git/commits'));
  assert.ok(commit, 'the stale branch must be reconciled before a successful no-op');
  assert.equal(commit.body.tree, 'base-tree');
  assert.equal(f.mutations.filter(x => x.path.endsWith('/git/trees')).length, 0);
  assert.equal(f.mutations.find(x => x.path.endsWith('/git/refs/heads/codex/documentation-sync')).body.force, false);
});
for (const options of [{mainSha: old}, {head: old}, {head: old, human: true}]) {
  test('stale main or concurrent branch changes never write GitHub state ' + JSON.stringify(options), async () => {
    const f = fixture(options);
    const meta = options.human ? {...metadata, branchSha: old} : metadata;
    await assert.rejects(publishProposal({...f, metadata: meta, changes, summary: 'Update', evidence: ['core/example.py']}), /changed|human/);
    assert.deepEqual(f.mutations, []);
  });
}
test('retry updates the existing PR and fast-forwards the bot branch without force', async () => {
  const f = fixture({head: old, existingPR: {number: 7, state: 'open'}});
  await publishProposal({...f, metadata: {...metadata, branchSha: old}, changes, summary: 'Update', evidence: ['core/example.py']});
  const ref = f.mutations.find(x => x.path.endsWith('/git/refs/heads/codex/documentation-sync'));
  assert.equal(ref.body.force, false);
  assert.deepEqual(f.mutations.find(x => x.path.endsWith('/git/commits')).body.parents, [main, old]);
  assert.equal(f.mutations.filter(x => x.path.endsWith('/pulls')).length, 0);
});
test('a manually closed PR does not count as acceptance and is not silently reopened', async () => {
  const f = fixture({existingPR: {number: 7, state: 'closed', merged_at: null}});
  await assert.rejects(publishProposal({...f, metadata, changes, summary: 'Update', evidence: ['core/example.py']}), /closed/);
  assert.deepEqual(f.mutations, []);
});
