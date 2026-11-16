import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {syncReference, validateAssets, selectRelease, readLimited} from './sync.mjs';

export function fixture() {
  const schema = {openapi:'3.1.0', info:{title:'Fixture API', version:'v1'}, paths:{'/api/jobs':{get:{summary:'List jobs', responses:{200:{description:'OK',content:{'application/json':{schema:{$ref:'#/components/schemas/Job'}}}}}}}}, components:{schemas:{Job:{type:'object',properties:{id:{type:'string'}}}}}};
  const files = Object.fromEntries(['public','application'].map(kind => [`openapi-${kind}.json`, Buffer.from(JSON.stringify(schema))]));
  const manifest = {schema_version:1,release:'v0.9.18',revision:'a'.repeat(40),schemas:Object.fromEntries(['public','application'].map(kind=>[kind,{file:`openapi-${kind}.json`,sha256:createHash('sha256').update(files[`openapi-${kind}.json`]).digest('hex'),paths:1,operations:1}]))};
  const refresh = () => { files['openapi-manifest.json']=Buffer.from(JSON.stringify(manifest)); };
  refresh(); return {files,manifest,refresh};
}
const release = {tag_name:'v0.9.18',draft:false,prerelease:false,assets:['openapi-public.json','openapi-application.json','openapi-manifest.json'].map((name,id)=>({id:id+1,name,size:100,url:`https://api.github.com/repos/Flow-Steward/flow-steward-app/releases/assets/${id+1}`}))};
test('selects only stable releases from bootstrap onward and never falls back on an incomplete latest release', () => {
 assert.equal(selectRelease(release).tag_name,'v0.9.18');
 for (const change of [{prerelease:true},{draft:true},{tag_name:'v0.9.17'},{tag_name:'v1.0.0-rc.1'},{assets:release.assets.slice(0,2)}]) assert.throws(()=>selectRelease({...release,...change}));
});
test('validates exact bytes, release/revision provenance, both counts and OpenAPI schemas without mutating downloads', async()=>{
 const f=fixture(); const before=Buffer.from(f.files['openapi-public.json']);
 await validateAssets(f.files,{release:'v0.9.18',revision:'a'.repeat(40)});
 assert.deepEqual(f.files['openapi-public.json'],before);
 for(const change of [{release:'v0.9.19'},{revision:'b'.repeat(40)},{schema_version:2}]) {const g=fixture(); Object.assign(g.manifest,change); g.refresh(); await assert.rejects(validateAssets(g.files,{release:'v0.9.18',revision:'a'.repeat(40)}));}
});
test('rejects missing assets, hashes, counts, bad filenames, malformed OpenAPI, remote and unresolved local refs',async()=>{
 const cases=[f=>delete f.files['openapi-public.json'],f=>f.files['openapi-public.json']=Buffer.from('{}'),f=>f.manifest.schemas.public.paths++,f=>f.manifest.schemas.public.operations++,f=>f.manifest.schemas.public.file='../outside.json'];
 for(const mutate of cases){const f=fixture(); mutate(f); f.refresh(); await assert.rejects(validateAssets(f.files,{release:'v0.9.18',revision:'a'.repeat(40)}));}
 for(const mutate of [s=>delete s.info.title,s=>s.paths['/api/jobs'].get.responses=null,s=>s.components.schemas.Job={$ref:'https://example.invalid/private'},s=>s.components.schemas.Job={$ref:'file:///etc/passwd'},s=>s.components.schemas.Job={$ref:'#/components/schemas/Missing'}]){
  const f=fixture(); const s=JSON.parse(f.files['openapi-public.json']); mutate(s); f.files['openapi-public.json']=Buffer.from(JSON.stringify(s)); f.manifest.schemas.public.sha256=createHash('sha256').update(f.files['openapi-public.json']).digest('hex'); f.refresh(); await assert.rejects(validateAssets(f.files,{release:'v0.9.18',revision:'a'.repeat(40)}));
 }
});
test('bounds streamed bodies even without content-length', async()=>{
 const response=new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(11));c.close();}}));
 await assert.rejects(readLimited(response,10),/size limit/);
});
test('downloads latest once, resolves the tag SHA, writes only a fully verified set and clears stale files on failure',async t=>{
 const f=fixture(); const output=await mkdtemp(join(tmpdir(),'reference-test-')); t.after(()=>rm(output,{recursive:true,force:true}));
 const requests=[];
 for(const asset of release.assets) asset.size=f.files[asset.name].length;
 const fetchImpl=async(url,opts)=>{requests.push([url,opts]); if(url.endsWith('/releases/latest')) return Response.json(release); if(url.endsWith('/commits/v0.9.18')) return Response.json({sha:'a'.repeat(40)}); const asset=release.assets.find(a=>a.url===url); return asset ? new Response(f.files[asset.name]) : new Response('missing',{status:404});};
 await syncReference({output,fetchImpl});
 assert.equal(JSON.parse(await readFile(join(output,'openapi-manifest.json'))).release,'v0.9.18');
 assert.deepEqual((await readdir(output)).sort(),Object.keys(f.files).sort());
 assert.ok(requests.some(([u])=>u.endsWith('/commits/v0.9.18')));
 await writeFile(join(output,'stale.json'),'stale'); delete f.files['openapi-public.json'];
 await assert.rejects(syncReference({output,fetchImpl}));
 await assert.rejects(readFile(join(output,'openapi-manifest.json')),/ENOENT/);
});
test('an explicit local release remains exact while normal refresh always requests latest',async t=>{
 const f=fixture();const output=await mkdtemp(join(tmpdir(),'reference-test-'));t.after(()=>rm(output,{recursive:true,force:true}));
 const metadata={...release,assets:release.assets.map(a=>({...a,size:f.files[a.name].length}))};
 const requested=[];const fetchImpl=async url=>{requested.push(url);if(url.includes('/releases/tags/')||url.endsWith('/releases/latest'))return Response.json(metadata);if(url.includes('/commits/'))return Response.json({sha:'a'.repeat(40)});return new Response(f.files[metadata.assets.find(a=>a.url===url).name]);};
 await syncReference({output,fetchImpl,release:'v0.9.18'});assert.ok(requested[0].endsWith('/releases/tags/v0.9.18'));
 requested.length=0;await syncReference({output,fetchImpl});assert.ok(requested[0].endsWith('/releases/latest'));
});
test('delayed release notifications cannot pin or fail the latest production refresh',async()=>{
 const workflow=await readFile(new URL('../../.github/workflows/deploy-server.yml',import.meta.url),'utf8');
 assert.match(workflow,/types: \[api-reference-release\]/);assert.match(workflow,/npm run build:release/);
 assert.doesNotMatch(workflow,/API_REFERENCE_(?:EXPECTED_RELEASE|EXPECTED_REVISION|RELEASE):/);
 // Dispatch payload is intentionally absent from the build environment: latest is authoritative.
 assert.doesNotMatch(workflow,/client_payload\.(?:release|revision)/);
});
