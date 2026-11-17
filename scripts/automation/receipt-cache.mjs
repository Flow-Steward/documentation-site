import {randomUUID, createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, lstatSync, readdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {canonical, digest, textHash, scopeInventory, sourceSnapshot, gitRead, byPath} from './input-identity.mjs';
import {checkReceipt} from './batches.mjs';
import {DOCS_REPO} from './publish.mjs';

const HASH = /^[a-f0-9]{64}$/;
export const RECEIPT_BRANCH = 'codex/docs-receipts';
function hash(value) { if (!HASH.test(value)) throw new Error('invalid cache hash'); return value; }
function regular(path) {
  if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error('cache entry must be a regular file');
  return readFileSync(path, 'utf8');
}
function directory(path, create = true) {
  // Reject symlinks in every existing parent, including the chosen cache root.
  const absolute = resolve(path);
  let current = absolute;
  while (current !== resolve(current, '..')) {
    if (existsSync(current) && (!lstatSync(current).isDirectory() || lstatSync(current).isSymbolicLink())) throw new Error('cache directory has a symlink or non-directory component');
    current = resolve(current, '..');
  }
  if (create) mkdirSync(absolute, {recursive: true});
  else if (!existsSync(absolute)) throw new Error('restored receipt cache is incomplete');
  return absolute;
}
function immutable(root, content) {
  const bytes = canonical(content) + '\n', id = textHash(bytes);
  const path = join(root, 'objects', `${id}.json`);
  try { writeFileSync(path, bytes, {flag: 'wx', mode: 0o600}); }
  catch (error) { if (error.code !== 'EEXIST' || regular(path) !== bytes) throw error; }
  return id;
}
function object(root, id) {
  const bytes = regular(join(root, 'objects', `${hash(id)}.json`));
  if (textHash(bytes) !== id) throw new Error('cache object integrity failure');
  return JSON.parse(bytes);
}
function assertInputs(input) {
  hash(input.pageHash); hash(input.contextHash); hash(input.fingerprint);
  if (digest(input.context) !== input.contextHash || input.context.page !== input.page || input.context.reviewer.model !== 'gpt-6-luna' || digest({contextHash: input.contextHash, pageHash: input.pageHash}) !== input.fingerprint) throw new Error('receipt input identity differs');
  // Keep pre-contract identities readable without rewriting preserved receipts.
  const watched = input.context.sourceScopes.flatMap(scope => scope.files);
  if (![2, 3].includes(input.context.version)) throw new Error('unsupported receipt context');
  const changed = new Set(input.context.relevantChanges.flatMap(change => [change.path, change.oldPath].filter(Boolean)));
  const selected = input.context.version === 3
    ? [...input.context.readSourceScopes.flatMap(scope => scope.files), ...watched.filter(file => changed.has(file.path))]
    : watched;
  const watchByPath = new Map(watched.map(file => [file.path, file]));
  if (selected.some(file => digest(watchByPath.get(file.path) ?? null) !== digest(file))) throw new Error('receipt read inventory is outside watch inventory');
  const files = [...new Map(selected.map(file => [file.path, file])).values()].sort(byPath);
  if (digest(files) !== digest(input.sourceFiles)) throw new Error('receipt source allowlist differs');
}

export function openReceiptCache(path) {
  const root = directory(path);
  for (const child of ['objects', 'entries', 'reservations', 'dispatches']) directory(join(root, child));
  return {root};
}

export function reserve(cache, input, {owner = randomUUID(), now = Date.now(), leaseMs = 20 * 60 * 1000} = {}) {
  assertInputs(input);
  if (!owner || !Number.isSafeInteger(now) || !Number.isSafeInteger(leaseMs) || leaseMs < 1) throw new Error('invalid reservation');
  const path = join(cache.root, 'reservations', `${hash(input.fingerprint)}.json`);
  const record = {version: 1, fingerprint: input.fingerprint, owner, state: 'reserved', expiresAt: now + leaseMs};
  // Never auto-reclaim an expired reservation: it may have been dispatched by
  // a runner that died before recording the provider's response.
  try { writeFileSync(path, canonical(record) + '\n', {flag: 'wx', mode: 0o600}); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const existing = JSON.parse(regular(path));
    return {acquired: false, state: existing.expiresAt <= now ? 'uncertain' : existing.state, owner: existing.owner};
  }
  return {acquired: true, ...record};
}
export function markDispatched(cache, input, reservation) {
  assertInputs(input);
  const path = join(cache.root, 'reservations', `${hash(input.fingerprint)}.json`);
  const current = JSON.parse(regular(path));
  if (current.owner !== reservation.owner || current.state !== 'reserved' || current.expiresAt <= Date.now()) throw new Error('reservation cannot dispatch');
  // Exclusive marker also prevents two callers sharing an owner from granting
  // the same dispatch concurrently. Never remove it on a timeout.
  writeFileSync(join(cache.root, 'dispatches', `${hash(input.fingerprint)}.json`), canonical({fingerprint: input.fingerprint, owner: current.owner}) + '\n', {flag: 'wx', mode: 0o600});
  const next = {...current, state: 'dispatched'};
  // Owner is the sole writer; the immutable reservation is never removed or
  // reassigned. A crash leaves the identity blocked, not eligible for retry.
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, canonical(next) + '\n', {flag: 'wx', mode: 0o600});
  renameSync(temp, path);
  return next;
}

export function saveReceipt(cache, {rawBytes, input, task, metadata, docsRoot, productRoot, reservation}) {
  assertInputs(input);
  const rawHash = immutable(cache.root, {version: 1, kind: 'raw', rawBytes, provenance: metadata});
  let receipt;
  try {
    receipt = JSON.parse(rawBytes);
    if (task.path !== input.page || metadata.sourceSha !== receipt.source_sha || metadata.docsSha !== receipt.docs_sha) throw new Error('receipt identity differs from its inputs');
    if (textHash(regular(resolve(docsRoot, input.page))) !== input.pageHash) throw new Error('page changed before receipt saving');
    const allowed = new Set(input.sourceFiles.map(file => file.path));
    if (digest(scopeInventory(sourceSnapshot(productRoot, metadata.sourceSha), input.context.rule.scopes)) !== digest(input.context.sourceScopes)) throw new Error('saved source inventory differs from receipt inputs');
    for (const file of input.sourceFiles) {
      if (gitRead(productRoot, ['hash-object', '--no-filters', '--', file.path]).trim() !== file.oid) throw new Error('product checkout differs from scoped inputs');
    }
    checkReceipt(receipt, task, metadata, docsRoot, productRoot);
    if (receipt.evidence.some(value => !allowed.has(value.split(' — ', 1)[0]))) throw new Error('receipt cites source outside its declared scope');
  } catch (error) {
    immutable(cache.root, {version: 1, kind: 'rejected', rawHash, reason: error.message});
    return {reusable: false, rawHash, reason: error.message};
  }
  const state = JSON.parse(regular(join(cache.root, 'reservations', `${hash(input.fingerprint)}.json`)));
  if (state.owner !== reservation.owner || state.state !== 'dispatched') throw new Error('receipt has no dispatched reservation');
  const output = receipt.updates[0]?.content ?? regular(resolve(docsRoot, input.page));
  const record = {version: 1, kind: 'validated-receipt', rawHash, input, outputPageHash: textHash(output), task, metadata};
  const receiptHash = immutable(cache.root, record);
  // Two aliases support original-input retry and an already-applied output.
  for (const pageHash of new Set([input.pageHash, record.outputPageHash])) {
    const key = digest({contextHash: input.contextHash, pageHash});
    const entry = join(cache.root, 'entries', `${key}.json`);
    const bytes = canonical({version: 1, receiptHash}) + '\n';
    try { writeFileSync(entry, bytes, {flag: 'wx', mode: 0o600}); }
    catch (error) { if (error.code !== 'EEXIST' || regular(entry) !== bytes) throw new Error('conflicting receipt for the same inputs'); }
  }
  return {reusable: true, rawHash, receiptHash};
}

export function lookupReceipt(cache, input) {
  assertInputs(input);
  for (const child of ['objects', 'entries']) directory(join(cache.root, child), false);
  const entry = join(cache.root, 'entries', `${input.fingerprint}.json`);
  if (!existsSync(entry)) return {hit: false, reason: 'no matching content inputs'};
  const {receiptHash} = JSON.parse(regular(entry));
  const record = object(cache.root, receiptHash);
  assertInputs(record.input);
  const raw = object(cache.root, record.rawHash);
  if (record.kind !== 'validated-receipt' || record.input.contextHash !== input.contextHash || record.input.page !== input.page || ![record.input.pageHash, record.outputPageHash].includes(input.pageHash)) throw new Error('cached receipt does not prove current inputs');
  const receipt = JSON.parse(raw.rawBytes);
  if (receipt.status !== 'completed' || receipt.task_id !== record.task.id || receipt.source_sha !== record.metadata.sourceSha || receipt.docs_sha !== record.metadata.docsSha || receipt.reviewed_document !== input.page) throw new Error('invalid cached receipt provenance');
  return {hit: true, receiptHash, receipt, alreadyApplied: input.pageHash === record.outputPageHash,
    proof: {originalSourceSha: receipt.source_sha, originalDocsSha: receipt.docs_sha, contextHash: input.contextHash, currentPageHash: input.pageHash}};
}

export function ledgerFiles(cache) {
  const files = [];
  for (const child of ['objects', 'entries', 'reservations', 'dispatches']) {
    for (const name of readdirSync(join(cache.root, child)).sort()) {
      if (!/^[a-f0-9]{64}\.json$/.test(name)) throw new Error('unexpected ledger file');
      const content = regular(join(cache.root, child, name));
      const value = JSON.parse(content);
      const id = name.slice(0, -5);
      if (child === 'objects' && textHash(content) !== id) throw new Error('corrupt immutable ledger object');
      if (child === 'entries') hash(value.receiptHash);
      if (['reservations', 'dispatches'].includes(child) && (value.fingerprint !== id || typeof value.owner !== 'string' || !value.owner)) throw new Error('invalid ledger reservation');
      files.push({path: `${child}/${name}`, mode: '100644', type: 'blob', content});
    }
  }
  return files;
}

// Explicit persistence operation, never called by planning or cache lookup.
// Callers must persist reservations before dispatch and receipts before any
// downstream build. A lease rejection stops paid work until reconciliation.
export async function persistLedger({api, cache, expectedHead}) {
  const base = `/repos/${DOCS_REPO}`;
  const branch = await api('GET', `${base}/git/ref/heads/${RECEIPT_BRANCH}`, undefined, true);
  if ((branch?.object.sha ?? null) !== expectedHead) throw new Error('receipt ledger lease changed; do not dispatch');
  const parent = branch ? await api('GET', `${base}/git/commits/${expectedHead}`) : null;
  const files = ledgerFiles(cache);
  if (!files.length || files.length > 1000 || Buffer.byteLength(canonical(files)) > 8 * 1024 * 1024) throw new Error('receipt ledger snapshot outside supported limits; do not dispatch');
  if (parent) {
    const remote = await api('GET', `${base}/git/trees/${parent.tree.sha}?recursive=1`);
    if (remote.truncated) throw new Error('ledger tree truncated; do not dispatch');
    const byPath = new Map(remote.tree.filter(entry => entry.type === 'blob').map(entry => [entry.path, entry]));
    for (const file of files) {
      const previous = byPath.get(file.path);
      if (!previous) continue;
      const bytes = Buffer.from(file.content);
      const oid = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      if (oid === previous.sha) continue;
      if (!file.path.startsWith('reservations/')) throw new Error('refusing to overwrite an immutable remote ledger entry');
      const blob = await api('GET', `${base}/git/blobs/${previous.sha}`);
      const before = JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8'));
      const after = JSON.parse(file.content);
      if (before.owner !== after.owner || before.fingerprint !== after.fingerprint || before.state !== 'reserved' || after.state !== 'dispatched' || before.expiresAt !== after.expiresAt) throw new Error('invalid remote reservation transition');
    }
  }
  const tree = await api('POST', `${base}/git/trees`, {...(parent ? {base_tree: parent.tree.sha} : {}), tree: files});
  if (parent && tree.sha === parent.tree.sha) return expectedHead;
  const commit = await api('POST', `${base}/git/commits`, {message: 'docs: persist receipt ledger [skip ci]', tree: tree.sha, parents: expectedHead ? [expectedHead] : []});
  if (branch) await api('PATCH', `${base}/git/refs/heads/${RECEIPT_BRANCH}`, {sha: commit.sha, force: false});
  else await api('POST', `${base}/git/refs`, {ref: `refs/heads/${RECEIPT_BRANCH}`, sha: commit.sha});
  return commit.sha;
}

// Coverage is independent of site publication. Only a completed no-change proof
// can become a later diff base; pending PR updates never advance this cursor.
export function recordCoverage(cache, value) {
  if (!['no_documentation_required', 'completed_cached_noop'].includes(value.status) || !/^[a-f0-9]{40}$/.test(value.sourceSha)) throw new Error('only completed no-change coverage may be stored');
  return immutable(cache.root, {...value, version: 1, kind: 'completed-coverage'});
}
export function coverageRecords(cache) {
  return readdirSync(join(cache.root, 'objects')).filter(name => /^[a-f0-9]{64}\.json$/.test(name)).map(name => object(cache.root, name.slice(0, -5))).filter(value => value.kind === 'completed-coverage');
}
