import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateProposal, checkpoint, publicationPlan} from './proposal.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'fs-docs-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  mkdirSync(join(root, 'docs/user'), {recursive: true});
  writeFileSync(join(root, 'docs/user/workflows.md'), '# Workflows\n');
  return root;
}
const sha = 'a'.repeat(40);
const proposal = () => ({status: 'completed', summary: 'Document saved workflow behavior', evidence: ['core/application/workflows/example.py'], updates: [{path: 'docs/user/workflows.md', content: '# Updated workflows\n'}]});

test('produces UTF-8 blob changes and a deterministic source checkpoint', t => {
  const root = fixture(t);
  const changes = validateProposal(proposal(), root);
  const plan = publicationPlan(changes, {sourceSha: sha, docsSha: 'b'.repeat(40)});
  assert.equal(plan[0].path, 'docs/user/workflows.md');
  assert.equal(plan[0].content, '# Updated workflows\n');
  assert.deepEqual(JSON.parse(plan[1].content), {repository: 'Flow-Steward/flow-steward-app', revision: sha, docs_base: 'b'.repeat(40)});
});
test('empty or byte-identical updates do not advance the checkpoint', t => {
  const root = fixture(t);
  const p = proposal();
  p.updates[0].content = '# Workflows\n';
  assert.deepEqual(validateProposal(p, root), []);
  assert.deepEqual(publicationPlan([], {sourceSha: sha, docsSha: sha}), []);
});
for (const path of ['../README.md', 'docs/../README.md', 'docs/user/../../.github/workflows/x.md', '/docs/x.md', 'docs/user\\x.md', '.github/workflows/x.yml', 'docs/new.md']) {
  test(`rejects out-of-scope or untracked navigation path ${path}`, t => {
    const root = fixture(t);
    const p = proposal(); p.updates[0].path = path;
    assert.throws(() => validateProposal(p, root), /path|existing/);
  });
}
test('rejects a symlink in the documentation path', t => {
  const root = fixture(t);
  symlinkSync(join(root, 'docs/user/workflows.md'), join(root, 'docs/user/link.md'));
  const p = proposal(); p.updates[0].path = 'docs/user/link.md';
  assert.throws(() => validateProposal(p, root), /symlink/);
});
test('rejects duplicates, empty content, oversized output and missing evidence', t => {
  const root = fixture(t);
  const p = proposal(); p.updates.push(p.updates[0]);
  assert.throws(() => validateProposal(p, root), /duplicate/);
  p.updates = [{path: 'docs/user/workflows.md', content: ''}];
  assert.throws(() => validateProposal(p, root), /content/);
  p.updates[0].content = 'x'.repeat(1024 * 1024 + 1);
  assert.throws(() => validateProposal(p, root), /size/);
  p.updates[0].content = 'valid'; p.evidence = [];
  assert.throws(() => validateProposal(p, root), /evidence/);
});
test('checkpoint is absent on bootstrap and rejects foreign repositories or malformed SHAs', t => {
  const root = fixture(t);
  assert.equal(checkpoint(root), null);
  mkdirSync(join(root, '.automation'));
  writeFileSync(join(root, '.automation/docs-source.json'), JSON.stringify({repository: 'private/source', revision: sha}));
  assert.throws(() => checkpoint(root), /checkpoint/);
  writeFileSync(join(root, '.automation/docs-source.json'), JSON.stringify({repository: 'Flow-Steward/flow-steward-app', revision: '--all'}));
  assert.throws(() => checkpoint(root), /checkpoint/);
});

for (const status of [undefined, 'failed', 'incomplete']) {
  test(`an empty result with ${status} status cannot become a successful no-op`, t => {
    const root = fixture(t), p = proposal();
    p.status = status; p.updates = [];
    assert.throws(() => validateProposal(p, root), /incomplete|failed/);
  });
}
test('FAILED summary with nonempty evidence is rejected even if status claims completed', t => {
  const root = fixture(t), p = proposal();
  p.summary = 'FAILED: The required bootstrap review could not be completed'; p.updates = [];
  assert.throws(() => validateProposal(p, root), /incomplete|failed/);
});
