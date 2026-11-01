import {existsSync, lstatSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

export const SOURCE = 'Flow-Steward/flow-steward-app';
export const SHA = /^[a-f0-9]{40}$/;
const MAX_BYTES = 1024 * 1024;

export function checkpoint(root) {
  const path = join(root, '.automation/docs-source.json');
  if (!existsSync(path)) return null;
  const value = JSON.parse(readFileSync(path, 'utf8'));
  if (value.repository !== SOURCE || !SHA.test(value.revision)) throw new Error('invalid source checkpoint');
  return value.revision;
}

export function validateProposal(proposal, root) {
  if (!proposal || proposal.status !== 'completed') throw new Error('documentation review is incomplete or failed');
  if (typeof proposal.summary !== 'string' || !proposal.summary.trim() || proposal.summary.length > 10000) throw new Error('invalid summary');
  if (/^\s*[*#>_-]*\s*(?:FAILED|INCOMPLETE|ABORTED|UNFINISHED)\b|could not (?:be )?(?:complete|finish)|review (?:is |remains |was )?(?:incomplete|unfinished|not completed)/i.test(proposal.summary)) throw new Error('summary reports an incomplete or failed review');
  if (!Array.isArray(proposal.evidence) || !proposal.evidence.length || proposal.evidence.some(p => typeof p !== 'string' || !p.trim() || p.length > 1000)) throw new Error('source evidence is required');
  if (!Array.isArray(proposal.updates) || proposal.updates.length > 200) throw new Error('invalid updates size');
  const seen = new Set();
  let bytes = 0;
  return proposal.updates.filter(update => {
    const {path, content} = update;
    if (typeof path !== 'string' || !/^docs\/[a-zA-Z0-9_/-]+\.mdx?$/.test(path) || path.split('/').some(part => part === '..' || part === '.' || !part)) throw new Error('invalid documentation path');
    if (seen.has(path)) throw new Error('duplicate documentation path');
    seen.add(path);
    let current = root;
    for (const part of path.split('/')) {
      current = join(current, part);
      if (!existsSync(current)) throw new Error('only existing documentation paths may be updated');
      if (lstatSync(current).isSymbolicLink()) throw new Error('symlink documentation path');
    }
    if (!lstatSync(current).isFile()) throw new Error('documentation path is not a file');
    if (typeof content !== 'string' || !content.trim() || content.includes('\0')) throw new Error('invalid document content');
    bytes += Buffer.byteLength(content);
    if (bytes > MAX_BYTES) throw new Error('proposal exceeds size limit');
    return readFileSync(current, 'utf8') !== content;
  }).map(({path, content}) => ({path, mode: '100644', type: 'blob', content}));
}

export function publicationPlan(changes, {sourceSha, docsSha}) {
  if (!SHA.test(sourceSha) || !SHA.test(docsSha)) throw new Error('invalid publication SHA');
  if (!changes.length) return [];
  return [...changes, {path: '.automation/docs-source.json', mode: '100644', type: 'blob', content: JSON.stringify({repository: SOURCE, revision: sourceSha, docs_base: docsSha}, null, 2) + '\n'}];
}
