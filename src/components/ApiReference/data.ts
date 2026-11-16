export type ApiKind = 'public' | 'application';
export type SchemaEntry = {file: string; sha256: string; paths: number; operations: number};
export type Manifest = {schema_version: 1; release: string; revision: string; schemas: Record<ApiKind, SchemaEntry>};
export type Reference = {manifest: Manifest; public: Record<string, unknown>; application: Record<string, unknown>};
const methods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
export async function loadReference(base: string, fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<Reference> {
 const request = async (file: string) => {
  const response = await fetchImpl(`${base}${file}`, {signal, cache: 'no-store'});
  if (!response.ok) throw new Error(`Reference download failed (${response.status})`);
  return response;
 };
 // Read metadata first; every subsequent schema request is bound to its exact bytes.
 const manifest = await (await request('openapi-manifest.json')).json();
 if (manifest.schema_version !== 1 || !/^v\d+\.\d+\.\d+$/.test(manifest.release) || !/^[a-f0-9]{40}$/.test(manifest.revision) ||
  Object.keys(manifest.schemas ?? {}).sort().join(',') !== 'application,public' ||
  !['public','application'].every(kind => manifest.schemas[kind]?.file === `openapi-${kind}.json` && /^[a-f0-9]{64}$/.test(manifest.schemas[kind].sha256) && Number.isSafeInteger(manifest.schemas[kind].paths) && manifest.schemas[kind].paths > 0 && Number.isSafeInteger(manifest.schemas[kind].operations) && manifest.schemas[kind].operations > 0)) throw new Error('Invalid reference manifest');
 const loadSchema = async (kind: ApiKind) => {
  const entry: SchemaEntry = manifest.schemas[kind];
  const response = await request(`${entry.file}?sha256=${entry.sha256}`);
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 16 * 1024 * 1024) throw new Error('Invalid OpenAPI reference size');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== entry.sha256) throw new Error('OpenAPI reference checksum mismatch; retry after deployment');
  const schema = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
  if (!/^3\.(0|1)\.\d+$/.test(schema.openapi ?? '') || !schema.info?.title || !schema.info?.version || !schema.paths || typeof schema.paths !== 'object') throw new Error('Invalid OpenAPI reference identity');
  const paths = Object.keys(schema.paths).filter(path => path.startsWith('/'));
  const operations = paths.reduce((total, path) => total + Object.keys(schema.paths[path]).filter(method => methods.has(method)).length, 0);
  if (paths.length !== entry.paths || operations !== entry.operations) throw new Error('OpenAPI reference count mismatch');
  return schema;
 };
 const [publicSchema, application] = await Promise.all([loadSchema('public'), loadSchema('application')]);
 return {manifest, public: publicSchema, application};
}
export function swaggerOptions(spec: Record<string, unknown>) {
 return {spec, filter: true, docExpansion: 'none', defaultModelsExpandDepth: 0, displayRequestDuration: false,
  supportedSubmitMethods: [], tryItOutEnabled: false, validatorUrl: null, persistAuthorization: false, queryConfigEnabled: false,
  requestInterceptor: () => { throw new Error('API execution is disabled in this documentation viewer'); },
 };
}
