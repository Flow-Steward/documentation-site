import {createHash} from 'node:crypto';
import {mkdir, rm, writeFile, readFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';

const API = 'https://api.github.com/repos/Flow-Steward/flow-steward-app';
const names = ['openapi-manifest.json','openapi-public.json','openapi-application.json'];
const methods = new Set(['get','put','post','delete','options','head','patch','trace']);
export const limits = {manifest: 64 * 1024, schema: 16 * 1024 * 1024};
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function stableTag(tag) {
 const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag ?? '');
 return match && (Number(match[1]) > 0 || Number(match[2]) > 9 || (Number(match[2]) === 9 && Number(match[3]) >= 18));
}
export function selectRelease(release) {
 requireValue(release && !release.draft && !release.prerelease && stableTag(release.tag_name), 'Expected stable release v0.9.18 or newer');
 for (const name of names) {
  const matches = release.assets?.filter(asset => asset.name === name) ?? [];
  requireValue(matches.length === 1, `Incomplete release ${release.tag_name}: expected exactly one ${name}`);
  const asset = matches[0];
  requireValue(Number.isSafeInteger(asset.id) && asset.id > 0 && asset.url === `${API}/releases/assets/${asset.id}`, `Invalid release asset URL: ${name}`);
  requireValue(Number.isSafeInteger(asset.size) && asset.size > 0 && asset.size <= (name === names[0] ? limits.manifest : limits.schema), `Asset exceeds size limit: ${name}`);
 }
 return release;
}
export async function readLimited(response, limit) {
 requireValue(response.ok, `GitHub request failed (${response.status})`);
 requireValue(Number(response.headers.get('content-length') ?? 0) <= limit, 'Response exceeds size limit');
 const chunks = []; let size = 0;
 for await (const chunk of response.body ?? []) {
  size += chunk.length;
  requireValue(size <= limit, 'Response exceeds size limit'); chunks.push(chunk);
 }
 return Buffer.concat(chunks);
}
function parse(bytes, name, limit) {
 requireValue(bytes && bytes.length > 0 && bytes.length <= limit, `Missing or oversized ${name}`);
 try { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); } catch { throw new Error(`Invalid UTF-8 JSON: ${name}`); }
}
function inspectRefs(value) {
 if (!value || typeof value !== 'object') return;
 if ('$ref' in value) requireValue(typeof value.$ref === 'string' && value.$ref.startsWith('#/components/'), 'Only local component references are allowed');
 for (const entry of Object.values(value)) inspectRefs(entry);
}
export async function validateAssets(files, expected) {
 const manifest = parse(files[names[0]], names[0], limits.manifest);
 requireValue(manifest.schema_version === 1 && manifest.release === expected.release && /^[a-f0-9]{40}$/.test(manifest.revision) && manifest.revision === expected.revision, 'Manifest release/revision/schema_version mismatch');
 requireValue(Object.keys(manifest.schemas ?? {}).sort().join(',') === 'application,public', 'Manifest must include exactly both schemas');
 for (const kind of ['public','application']) {
  const entry = manifest.schemas[kind]; const name = `openapi-${kind}.json`; const bytes = files[name];
  requireValue(entry.file === name && /^[a-f0-9]{64}$/.test(entry.sha256), `Invalid manifest entry: ${kind}`);
  const schema = parse(bytes,name,limits.schema);
  requireValue(createHash('sha256').update(bytes).digest('hex') === entry.sha256, `SHA-256 mismatch: ${name}`);
  requireValue(/^3\.(0|1)\.\d+$/.test(schema.openapi ?? '') && schema.paths && typeof schema.paths === 'object', `Invalid OpenAPI schema: ${name}`);
  inspectRefs(schema);
  const paths = Object.keys(schema.paths).filter(path => path.startsWith('/'));
  const operations = paths.reduce((total,path) => total + Object.keys(schema.paths[path]).filter(method => methods.has(method)).length,0);
  requireValue(Number.isSafeInteger(entry.paths) && entry.paths > 0 && entry.paths === paths.length && Number.isSafeInteger(entry.operations) && entry.operations > 0 && entry.operations === operations, `Path/operation count mismatch: ${name}`);
  // Clone because the validator dereferences its input; published bytes stay exact.
  await SwaggerParser.validate(structuredClone(schema), {resolve:{external:false,file:false,http:false}});
 }
 return manifest;
}
export async function syncReference({output = resolve('static/api/reference'), release: requested, token = process.env.GH_TOKEN, fetchImpl = fetch} = {}) {
 // A failed refresh must never leave a previously generated snapshot available for a later build.
 await rm(output, {recursive:true,force:true});
 if (requested) requireValue(stableTag(requested), 'Invalid requested release');
 const request = async (url,limit,accept = 'application/vnd.github+json') => readLimited(await fetchImpl(url,{headers:{Accept:accept,'X-GitHub-Api-Version':'2022-11-28',...(token ? {Authorization:`Bearer ${token}`} : {})},signal:AbortSignal.timeout(60000)}),limit);
 const release = selectRelease(JSON.parse(await request(`${API}/releases/${requested ? `tags/${requested}` : 'latest'}`,2*1024*1024)));
 const commit = JSON.parse(await request(`${API}/commits/${release.tag_name}`,2*1024*1024));
 requireValue(/^[a-f0-9]{40}$/.test(commit.sha), 'Release revision mismatch');
 const pairs = await Promise.all(names.map(async name => {
  const asset=release.assets.find(asset => asset.name === name);
  const bytes=await request(asset.url,name===names[0]?limits.manifest:limits.schema,'application/octet-stream');
  requireValue(bytes.length === asset.size, `Asset byte size mismatch: ${name}`);
  return [name,bytes];
 }));
 const files=Object.fromEntries(pairs); const manifest=await validateAssets(files,{release:release.tag_name,revision:commit.sha});
 await mkdir(output,{recursive:true});
 try { for(const name of names) await writeFile(join(output,name),files[name]); }
 catch(error) {await rm(output,{recursive:true,force:true}); throw error;}
 return manifest;
}
export async function verifyLocal(output=resolve('static/api/reference')) {
 const files=Object.fromEntries(await Promise.all(names.map(async name => [name,await readFile(join(output,name))])));
 const manifest=parse(files[names[0]],names[0],limits.manifest);
 requireValue(stableTag(manifest.release),'Invalid local reference release');
 return validateAssets(files,{release:manifest.release,revision:manifest.revision});
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 try {
  const manifest=process.argv.includes('--verify') ? await verifyLocal() : await syncReference({release:process.env.API_REFERENCE_RELEASE});
  console.log(`API reference verified: ${manifest.release} (${manifest.revision})`);
 } catch(error) {console.error(`API reference unavailable: ${error.message}. Run npm run api-reference:sync after release assets are published.`); process.exitCode=1;}
}
