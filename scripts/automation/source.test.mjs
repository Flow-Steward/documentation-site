import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sourceContext} from './source.mjs';

test('bootstrap covers the tree and later context covers every commit since acceptance', t => {
  const root = mkdtempSync(join(tmpdir(), 'fs-source-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  git('init', '-b', 'main'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test');
  writeFileSync(join(root, 'VERSION'), '1.0.0'); git('add', '.'); git('commit', '-m', 'initial');
  const first = git('rev-parse', 'HEAD');
  writeFileSync(join(root, 'feature.py'), 'new behavior'); git('add', '.'); git('commit', '-m', 'feature');
  const second = git('rev-parse', 'HEAD'); git('update-ref', 'refs/remotes/origin/main', second);
  assert.equal(sourceContext(root, second, null).mode, 'bootstrap');
  assert.deepEqual(sourceContext(root, second, first).changedPaths, ['feature.py']);
  assert.equal(sourceContext(root, second, second).mode, 'unchanged');
  assert.throws(() => sourceContext(root, '--all', first), /SHA/);
  git('checkout', '--orphan', 'unrelated'); git('commit', '--allow-empty', '-m', 'unrelated');
  const unrelated = git('rev-parse', 'HEAD');
  assert.throws(() => sourceContext(root, unrelated, first), /main/);
  assert.throws(() => sourceContext(root, second, unrelated), /checkpoint/);
});
