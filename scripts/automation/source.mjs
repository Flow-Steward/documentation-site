import {execFileSync} from 'node:child_process';
import {SHA, SOURCE} from './proposal.mjs';

const sourceGit = root => (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']}).trim();
const requireAncestor = (git, ancestor, descendant, message) => {
  try { git('merge-base', '--is-ancestor', ancestor, descendant); } catch { throw new Error(message); }
};

function requirePublicSource(git, revision) {
  if (!SHA.test(revision)) throw new Error('invalid source SHA');
  requireAncestor(git, revision, 'refs/remotes/origin/main', 'source revision is not on public main');
}

export function pinSourceRevision(root, revision) {
  const git = sourceGit(root);
  requirePublicSource(git, revision);
  git('checkout', '--detach', revision);
}

export function sourceContext(root, revision, previous) {
  if (previous !== null && !SHA.test(previous)) throw new Error('invalid source SHA');
  const git = sourceGit(root);
  requirePublicSource(git, revision);
  if (previous) requireAncestor(git, previous, revision, 'checkpoint is not an ancestor of source revision');
  const changed = previous ? git('diff', '--name-only', '-z', previous, revision) : git('ls-tree', '-r', '--name-only', '-z', revision);
  const changedPaths = changed.split('\0').filter(Boolean);
  if (changedPaths.length > 10000) throw new Error('source context exceeds file limit; split reconciliation explicitly');
  return {repository: SOURCE, revision, previous, mode: previous === revision ? 'unchanged' : previous ? 'incremental' : 'bootstrap', changedPaths};
}
