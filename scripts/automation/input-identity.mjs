import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {SHA} from './proposal.mjs';

export function canonical(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && Object.getPrototypeOf(value) === Object.prototype) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  throw new Error('identity must contain only JSON values');
}
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
export const textHash = text => createHash('sha256').update(text).digest('hex');
export const byPath = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
export function relativePath(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || /[\x00-\x1f\x7f]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('invalid relative source path');
  return path;
}
export function scopePath(scope) {
  if (typeof scope !== 'string') throw new Error('invalid source scope');
  const prefix = scope.endsWith('*') ? scope.slice(0, -1) : scope;
  relativePath(prefix.endsWith('/') ? prefix.slice(0, -1) : prefix);
  if (/[?*\[\]{}]/.test(prefix)) throw new Error('scopes must be exact paths, directory prefixes, or one trailing prefix wildcard');
  return scope;
}
export const matchesScope = (path, scope) => path === scope || (scope.endsWith('/') && path.startsWith(scope)) || (scope.endsWith('*') && path.startsWith(scope.slice(0, -1)));
export function gitRead(root, args) {
  return execFileSync('git', args, {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
}
export function sourceSnapshot(root, revision) {
  if (!SHA.test(revision)) throw new Error('invalid source SHA');
  return gitRead(root, ['ls-tree', '-rz', '--full-tree', revision]).split('\0').filter(Boolean).map(record => {
    const match = /^(\d+) (blob|tree|commit) ([a-f0-9]{40,64})\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error('invalid source tree record');
    return {mode: match[1], type: match[2], oid: match[3], path: relativePath(match[4])};
  }).sort(byPath);
}
export function scopeInventory(snapshot, scopes) {
  const sorted = [...new Set(scopes.map(scopePath))].sort();
  return sorted.map(scope => ({scope, files: snapshot.filter(file => matchesScope(file.path, scope))}));
}
export function changeSet(root, baseSha, sourceSha) {
  if (!SHA.test(sourceSha) || (baseSha !== null && !SHA.test(baseSha))) throw new Error('invalid change range');
  if (baseSha === null) return sourceSnapshot(root, sourceSha).map(file => ({status: 'A', oldPath: null, path: file.path}));
  gitRead(root, ['merge-base', '--is-ancestor', baseSha, sourceSha]);
  const fields = gitRead(root, ['diff', '--name-status', '-z', '--find-renames', baseSha, sourceSha, '--']).split('\0');
  const result = [];
  for (let i = 0; i < fields.length && fields[i];) {
    const status = fields[i++];
    if (!/^(?:[AMDTUXB]|R\d+|C\d+)$/.test(status)) throw new Error('unsupported Git change status');
    const first = relativePath(fields[i++]);
    const renamed = /^[RC]/.test(status);
    result.push({status, oldPath: renamed ? first : null, path: renamed ? relativePath(fields[i++]) : first});
  }
  return result;
}
