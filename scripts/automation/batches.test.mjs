import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reviewPlan, combineReceipts} from './batches.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'fs-docs-batches-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  mkdirSync(join(root, 'docs/user'), {recursive: true});
  mkdirSync(join(root, 'product/core'), {recursive: true});
  writeFileSync(join(root, 'docs/user/a.md'), '# A\n');
  writeFileSync(join(root, 'docs/user/b.md'), '# B\n');
  writeFileSync(join(root, 'product/core/example.py'), '# Public contract\n');
  const metadata = {sourceSha: 'a'.repeat(40), docsSha: 'b'.repeat(40)};
  const plan = reviewPlan(root, metadata);
  const receipts = plan.tasks.map(task => ({
    status: 'completed', task_id: task.id, source_sha: metadata.sourceSha,
    docs_sha: metadata.docsSha, reviewed_document: task.path,
    summary: 'Reviewed the assigned public contract; this page is accurate.',
    evidence: ['core/example.py'], updates: [],
  }));
  return {root, product: join(root, 'product'), metadata, plan, receipts};
}

test('combines every completed page and preserves review details for a real no-op', t => {
  const f = fixture(t), p = combineReceipts(f.plan, f.receipts, f.metadata, f.root, f.product);
  assert.equal(p.status, 'completed');
  assert.equal(p.reviews.length, 2);
  assert.deepEqual(p.updates, []);
});
for (const failure of ['missing', 'duplicate', 'incomplete', 'failed', 'foreign source', 'foreign page', 'failed summary', 'wrong update', 'missing evidence file']) {
  test(`never publishes a partial or invalid review: ${failure}`, t => {
    const f = fixture(t), r = f.receipts[0];
    if (failure === 'missing') f.receipts.pop();
    if (failure === 'duplicate') f.receipts[1] = r;
    if (failure === 'incomplete' || failure === 'failed') r.status = failure;
    if (failure === 'foreign source') r.source_sha = 'c'.repeat(40);
    if (failure === 'foreign page') r.reviewed_document = 'docs/user/b.md';
    if (failure === 'failed summary') r.summary = 'FAILED: bootstrap review could not be completed';
    if (failure === 'wrong update') r.updates = [{path: 'docs/user/b.md', content: '# Changed B\n'}];
    if (failure === 'missing evidence file') r.evidence = ['core/missing.py'];
    assert.throws(() => combineReceipts(f.plan, f.receipts, f.metadata, f.root, f.product));
  });
}
test('oversized pages fail planning instead of being omitted', t => {
  const f = fixture(t);
  writeFileSync(join(f.root, 'docs/user/a.md'), 'x'.repeat(96 * 1024 + 1));
  assert.throws(() => reviewPlan(f.root, f.metadata), /split it explicitly/);
});
