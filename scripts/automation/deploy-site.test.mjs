import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, rmSync, readdirSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const revision = 'a'.repeat(40);
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'fs-docs-deploy-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  for (const path of ['bin', 'build/assets', 'temp']) mkdirSync(join(root, path), {recursive: true});
  writeFileSync(join(root, 'build/index.html'), 'site');
  writeFileSync(join(root, 'build/404.html'), 'not found');
  writeFileSync(join(root, 'known_hosts'), 'example.invalid ssh-ed25519 public-key\n');
  const rsync = join(root, 'bin/rsync');
  writeFileSync(rsync, `#!${process.execPath}\nconst fs=require('node:fs');const p=require('node:path');const temp=p.join(process.env.RUNNER_TEMP,fs.readdirSync(process.env.RUNNER_TEMP)[0]);fs.writeFileSync(process.env.RECORD,JSON.stringify({args:process.argv.slice(2),mode:fs.statSync(p.join(temp,'key')).mode&511,key:fs.readFileSync(p.join(temp,'key'),'utf8')}));process.exit(Number(process.env.RSYNC_EXIT||0));\n`);
  chmodSync(rsync, 0o755);
  const curl = join(root, 'bin/curl');
  writeFileSync(curl, `#!${process.execPath}\nprocess.stdout.write(process.env.HTTP_REVISION+'\\n');\n`); chmodSync(curl, 0o755);
  const ssh = join(root, 'bin/ssh');
  writeFileSync(ssh, `#!${process.execPath}\nprocess.stdout.write(process.env.REMOTE_TARGET+'\\n');\n`); chmodSync(ssh, 0o755);
  const env = {...process.env, PATH: join(root, 'bin') + ':' + process.env.PATH, RUNNER_TEMP: join(root, 'temp'), RECORD: join(root, 'record.json'), DOCS_DEPLOY_HOST: 'example.invalid', DOCS_DEPLOY_USER: 'docs-deploy', DOCS_DEPLOY_SSH_KEY: 'fake-test-key', HTTP_REVISION: revision, REMOTE_TARGET: 'flow-steward-docs:/home/admin/docs-flowsteward/site'};
  const run = (sha = revision) => spawnSync('bash', [resolve('scripts/automation/deploy-site.sh'), join(root, 'build'), sha, join(root, 'known_hosts')], {encoding: 'utf8', env});
  return {root, env, run};
}
test('deploys the built site with pinned SSH identity and cleans the private key', t => {
  const f = fixture(t); const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const record = JSON.parse(readFileSync(join(f.root, 'record.json')));
  assert.equal(record.mode, 0o600);
  assert.match(record.args.find(x => x.startsWith('--rsh=')), /StrictHostKeyChecking=yes/);
  assert.match(record.args.find(x => x.startsWith('--rsh=')), /IdentitiesOnly=yes/);
  assert.ok(record.args.includes('--delay-updates'));
  assert.equal(record.args.at(-1), 'docs-deploy@example.invalid:./');
  assert.equal(readFileSync(join(f.root, 'build/deployment-revision.txt'), 'utf8'), revision+'\n');
  assert.deepEqual(readdirSync(join(f.root, 'temp')), []);
  assert.ok(!result.stdout.includes('fake-test-key'));
});
test('failed transfer or HTTP verification fails the deployment and removes key material', t => {
  const f = fixture(t); f.env.RSYNC_EXIT = '23';
  assert.equal(f.run().status, 23);
  assert.deepEqual(readdirSync(join(f.root, 'temp')), []);
  f.env.RSYNC_EXIT = '0'; f.env.HTTP_REVISION = 'b'.repeat(40);
  assert.match(f.run().stderr, /public site did not report/);
  assert.deepEqual(readdirSync(join(f.root, 'temp')), []);
});
test('rejects incomplete output, unsafe hosts, invalid revisions and source symlinks before transfer', t => {
  const f = fixture(t);
  assert.match(f.run('--all').stderr, /invalid deployment identity/);
  f.env.DOCS_DEPLOY_HOST = '-oProxyCommand=evil';
  assert.match(f.run().stderr, /invalid deployment identity/);
  f.env.DOCS_DEPLOY_HOST = 'example.invalid';
  symlinkSync(join(f.root, 'known_hosts'), join(f.root, 'build/link'));
  assert.match(f.run().stderr, /symlink/);
  rmSync(join(f.root, 'build/link')); rmSync(join(f.root, 'build/index.html'));
  assert.match(f.run().stderr, /missing production build/);
  assert.deepEqual(readdirSync(join(f.root, 'temp')), []);
});
test('a key without the restricted receiver cannot upload or delete files', t => {
  const f = fixture(t); f.env.REMOTE_TARGET = '/home/admin';
  assert.match(f.run().stderr, /restricted receiver/);
  assert.deepEqual(readdirSync(join(f.root, 'temp')), []);
  assert.throws(() => readFileSync(join(f.root, 'record.json')), /ENOENT/);
});
