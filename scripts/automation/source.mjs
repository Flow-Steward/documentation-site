import {execFileSync} from 'node:child_process';
import {SHA, SOURCE} from './proposal.mjs';

export function sourceContext(root, revision, previous) {
  if (!SHA.test(revision) || (previous !== null && !SHA.test(previous))) throw new Error('invalid source SHA');
  const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']}).trim();
  const ancestor = (a, b, message) => {
    try { git('merge-base', '--is-ancestor', a, b); } catch { throw new Error(message); }
  };
  ancestor(revision, 'refs/remotes/origin/main', 'source revision is not on public main');
  if (previous) ancestor(previous, revision, 'checkpoint is not an ancestor of source revision');
  const changed = previous ? git('diff', '--name-only', '-z', previous, revision) : git('ls-tree', '-r', '--name-only', '-z', revision);
  const changedPaths = changed.split('\0').filter(Boolean);
  if (changedPaths.length > 10000) throw new Error('source context exceeds file limit; split reconciliation explicitly');
  return {repository: SOURCE, revision, previous, mode: previous === revision ? 'unchanged' : previous ? 'incremental' : 'bootstrap', changedPaths};
}
