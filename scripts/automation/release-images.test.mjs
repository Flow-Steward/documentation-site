import test from 'node:test';
import assert from 'node:assert/strict';
import {findPins, pinResolves, releaseDigests, rewritePins} from './release-images.mjs';

const OLD = `sha256:${'a'.repeat(64)}`;
const NEW = `sha256:${'b'.repeat(64)}`;
const RABBIT = `sha256:${'c'.repeat(64)}`;

const verification = {
  version: '0.9.14',
  failures: [],
  registries: [
    {images: [
      {reference: 'ghcr.io/flow-steward/flow-steward-compact:0.9.14', index_digest: NEW},
      {reference: 'ghcr.io/flow-steward/flow-steward-postgres:0.9.14', index_digest: NEW},
    ]},
    {images: [{reference: 'docker.io/flowsteward/flow-steward-compact:0.9.14', index_digest: NEW}]},
  ],
};

test('pins carry their registry; bare names are Docker Hub library images', () => {
  const text = [
    `image = 'ghcr.io/flow-steward/flow-steward-compact@${OLD}'`,
    `rabbitmq_image=rabbitmq@${RABBIT}`,
    `- sha256:${'d'.repeat(64)}`,
  ].join('\n');
  assert.deepEqual(
    findPins(text).map(({registry, repository, digest}) => [registry, repository, digest]),
    [
      ['ghcr.io', 'flow-steward/flow-steward-compact', OLD],
      ['docker.io', 'library/rabbitmq', RABBIT],
    ],
  );
});

test('sync rewrites only images the release verified, and the helper release marker', () => {
  const text = [
    'flow_steward_release=0.9.13',
    `compact_image=ghcr.io/flow-steward/flow-steward-compact@${OLD}`,
    `postgres_image=ghcr.io/flow-steward/flow-steward-postgres@${OLD}`,
    `rabbitmq_image=rabbitmq@${RABBIT}`,
    `other=ghcr.io/someone-else/flow-steward-compact@${OLD}`,
  ].join('\n');
  const result = rewritePins(text, releaseDigests(verification), '0.9.14');
  assert.equal(result, [
    'flow_steward_release=0.9.14',
    `compact_image=ghcr.io/flow-steward/flow-steward-compact@${NEW}`,
    `postgres_image=ghcr.io/flow-steward/flow-steward-postgres@${NEW}`,
    `rabbitmq_image=rabbitmq@${RABBIT}`,
    `other=ghcr.io/someone-else/flow-steward-compact@${OLD}`,
  ].join('\n'));
});

test('a pin resolves only when the registry returns the manifest', async () => {
  const calls = [];
  const fakeFetch = async (url, options = {}) => {
    calls.push([url, options.method ?? 'GET']);
    if (url.includes('/token')) return {ok: true, json: async () => ({token: 't'})};
    return {status: url.includes(NEW) ? 200 : 404};
  };
  const [missing] = findPins(`ghcr.io/flow-steward/flow-steward-compact@${OLD}`);
  const [present] = findPins(`rabbitmq@${NEW}`);
  assert.equal(await pinResolves(missing, fakeFetch), 404);
  assert.equal(await pinResolves(present, fakeFetch), 200);
  assert.ok(calls.some(([url, method]) =>
    method === 'HEAD' && url === `https://registry-1.docker.io/v2/library/rabbitmq/manifests/${NEW}`));
  assert.ok(calls.some(([url]) => url.startsWith('https://ghcr.io/token?scope=repository:flow-steward/')));
});
