import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

test('receiver enforces write-only scope and server-side symlink munging independently of client flags', t => {
  const root = mkdtempSync(join(tmpdir(), 'fs-receiver-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const envFile = join(root, 'capture-exec.sh');
  const record = join(root, 'record');
  writeFileSync(envFile, 'exec() { printf "%s\\0" "$@" > "$RECEIVER_RECORD"; }\n');
  const env = {...process.env, BASH_ENV: envFile, RECEIVER_RECORD: record, SSH_ORIGINAL_COMMAND: 'rsync --server --unsafe-links . ./'};
  const result = spawnSync('bash', [resolve('scripts/automation/server-receiver.sh')], {env, encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(record, 'utf8').split('\0').filter(Boolean), ['/usr/bin/rrsync', '-wo', '-munge', '/home/admin/docs-flowsteward/site']);
  rmSync(record);
  env.SSH_ORIGINAL_COMMAND = 'id';
  assert.equal(spawnSync('bash', [resolve('scripts/automation/server-receiver.sh')], {env}).status, 126);
  assert.equal(existsSync(record), false);
});
