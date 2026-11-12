#!/usr/bin/env node
// Keep pinned container image digests in the deployment pages resolvable.
//
//   node scripts/automation/release-images.mjs check
//     Every `<image>@sha256:<digest>` in docs/, i18n/ and static/ must resolve
//     anonymously in its registry. Run by the documentation pull-request check.
//
//   node scripts/automation/release-images.mjs sync <version>
//     Rewrite every Flow Steward image pin to the digests a published release
//     verified (its registry-verification-*.json asset), and the release
//     version the Railway helper names. Review the diff, then run `check`.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCAN_DIRS = ['docs', 'i18n', 'static'];
const TEXT_EXTENSIONS = new Set(['.md', '.mdx', '.sh', '.toml', '.yaml', '.yml', '.txt', '.json']);
const RELEASE_REPOSITORY = 'Flow-Steward/flow-steward-app';
const RELEASE_VERSION_PATTERN = /^(flow_steward_release=)\d+\.\d+\.\d+$/m;
const PIN_PATTERN = /((?:[a-z0-9-]+\.)+[a-z0-9-]+\/)?([a-z0-9][a-z0-9._/-]*[a-z0-9])@(sha256:[0-9a-f]{64})/g;
const MANIFEST_ACCEPT = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.v2+json',
].join(', ');

/** Every distinct image pin in one text, with registry defaults made explicit. */
export function findPins(text) {
  const pins = [];
  for (const match of text.matchAll(PIN_PATTERN)) {
    const registryPrefix = match[1];
    let repository = match[2];
    // A bare `rabbitmq@sha256:` is a Docker Hub library image, but a path segment
    // such as `static/examples` is not a registry host.
    let registry = registryPrefix ? registryPrefix.slice(0, -1) : 'docker.io';
    if (registry === 'docker.io' && !repository.includes('/')) repository = `library/${repository}`;
    pins.push({ text: match[0], registry, repository, digest: match[3] });
  }
  return pins;
}

/** Map `ghcr.io/flow-steward/flow-steward-compact` → index digest from a release asset. */
export function releaseDigests(verification) {
  const digests = new Map();
  for (const registry of verification.registries ?? []) {
    for (const image of registry.images ?? []) {
      const reference = String(image.reference ?? '');
      const name = reference.replace(/:[^:/@]+$/, '');
      if (name && /^sha256:[0-9a-f]{64}$/.test(image.index_digest ?? '')) {
        digests.set(name, image.index_digest);
      }
    }
  }
  return digests;
}

/** Rewrite pins of images the release names; other pins are left untouched. */
export function rewritePins(text, digests, version) {
  let changed = text.replace(PIN_PATTERN, (whole, registryPrefix = '', repository) => {
    const digest = digests.get(`${registryPrefix}${repository}`);
    return digest ? `${registryPrefix}${repository}@${digest}` : whole;
  });
  if (version) changed = changed.replace(RELEASE_VERSION_PATTERN, `$1${version}`);
  return changed;
}

async function* textFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') yield* textFiles(full);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

async function registryToken(registry, repository, fetchImpl) {
  const url =
    registry === 'docker.io'
      ? `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repository}:pull`
      : `https://${registry}/token?scope=repository:${repository}:pull`;
  const response = await fetchImpl(url);
  if (!response.ok) return null;
  const body = await response.json();
  return body.token ?? body.access_token ?? null;
}

export async function pinResolves(pin, fetchImpl = fetch) {
  const host = pin.registry === 'docker.io' ? 'registry-1.docker.io' : pin.registry;
  const token = await registryToken(pin.registry, pin.repository, fetchImpl);
  const headers = { Accept: MANIFEST_ACCEPT };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(`https://${host}/v2/${pin.repository}/manifests/${pin.digest}`, {
    method: 'HEAD',
    headers,
  });
  return response.status;
}

async function check() {
  const unique = new Map();
  for (const dir of SCAN_DIRS) {
    for await (const file of textFiles(path.join(ROOT, dir))) {
      for (const pin of findPins(await readFile(file, 'utf8'))) {
        const key = `${pin.registry}/${pin.repository}@${pin.digest}`;
        if (!unique.has(key)) unique.set(key, { pin, files: new Set() });
        unique.get(key).files.add(path.relative(ROOT, file));
      }
    }
  }
  let failures = 0;
  for (const [key, { pin, files }] of unique) {
    const status = await pinResolves(pin);
    if (status !== 200) {
      failures += 1;
      console.error(`unresolved (${status}): ${key}\n  in ${[...files].join(', ')}`);
    } else {
      console.log(`ok: ${key}`);
    }
  }
  if (failures) {
    console.error(`${failures} pinned image digest(s) do not resolve. Run "sync <version>" or fix the pin.`);
    process.exit(1);
  }
}

async function sync(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    console.error('usage: release-images.mjs sync <version>, for example 0.9.14');
    process.exit(2);
  }
  const release = await fetch(
    `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/tags/v${version}`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!release.ok) throw new Error(`release v${version} not found (${release.status})`);
  const asset = (await release.json()).assets?.find((item) =>
    /^registry-verification-.*\.json$/.test(item.name),
  );
  if (!asset) throw new Error(`release v${version} has no registry-verification asset`);
  const verification = await (await fetch(asset.browser_download_url)).json();
  if (verification.version !== version || (verification.failures ?? []).length) {
    throw new Error(`registry verification for v${version} is not a clean verification of that version`);
  }
  const digests = releaseDigests(verification);
  for (const dir of SCAN_DIRS) {
    for await (const file of textFiles(path.join(ROOT, dir))) {
      const before = await readFile(file, 'utf8');
      const after = rewritePins(before, digests, version);
      if (after !== before) {
        await writeFile(file, after);
        console.log(`updated ${path.relative(ROOT, file)}`);
      }
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, argument] = process.argv.slice(2);
  if (command === 'check') await check();
  else if (command === 'sync') await sync(argument);
  else {
    console.error('usage: release-images.mjs check | sync <version>');
    process.exit(2);
  }
}
