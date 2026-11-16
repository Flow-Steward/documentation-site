import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadReference, swaggerOptions} from '../src/components/ApiReference/data.ts';
function fixture() {
 const schema={openapi:'3.1.0',info:{title:'Test API',version:'v1'},paths:{'/api/jobs':{get:{responses:{200:{description:'OK'}}}}}};
 const bytes=Buffer.from(JSON.stringify(schema));
 const hash=createHash('sha256').update(bytes).digest('hex');
 const manifest={schema_version:1,release:'v0.9.18',revision:'a'.repeat(40),schemas:{public:{file:'openapi-public.json',sha256:hash,paths:1,operations:1},application:{file:'openapi-application.json',sha256:hash,paths:1,operations:1}}};
 const requests=[];
 const get=async(url,options)=>{requests.push([url,options]);return url.endsWith('manifest.json')?Response.json(manifest):new Response(bytes);};
 return {schema,bytes,hash,manifest,requests,get};
}
test('loads manifest first without cache and verifies both hash-addressed schemas from exact bytes',async()=>{
 const f=fixture();const data=await loadReference('/api/reference/',f.get);
 assert.equal(data.manifest.release,'v0.9.18');assert.equal(data.application.openapi,'3.1.0');
 assert.equal(f.requests[0][0],'/api/reference/openapi-manifest.json');
 assert.equal(f.requests.length,3);
 assert.ok(f.requests.every(([,options])=>options.cache==='no-store'));
 assert.ok(f.requests.slice(1).every(([url])=>url.endsWith(`?sha256=${f.hash}`)));
});
test('rejects mixed deployment snapshots even when the changed document is valid OpenAPI',async()=>{
 const f=fixture();const changed=JSON.stringify({...f.schema,info:{title:'Different release',version:'v2'}});
 await assert.rejects(loadReference('/api/reference/',async url=>url.endsWith('manifest.json')?Response.json(f.manifest):new Response(changed)),/checksum/i);
});
test('rejects manifest count mismatches and invalid schema identity before rendering',async()=>{
 for(const corrupt of [f=>f.manifest.schemas.application.paths++,f=>f.manifest.schemas.public.operations++]) {
  const f=fixture();corrupt(f);await assert.rejects(loadReference('/api/reference/',f.get),/count/i);
 }
 const f=fixture(); const invalid=Buffer.from(JSON.stringify({...f.schema,openapi:'2.0'}));
 for(const entry of Object.values(f.manifest.schemas))entry.sha256=createHash('sha256').update(invalid).digest('hex');
 await assert.rejects(loadReference('/api/reference/',async url=>url.endsWith('manifest.json')?Response.json(f.manifest):new Response(invalid)),/OpenAPI/i);
});
test('surfaces missing files and invalid manifest metadata for the viewer error/retry state',async()=>{
 await assert.rejects(loadReference('/api/reference/',async()=>new Response('missing',{status:404})),/404/);
 const f=fixture();f.manifest.schema_version=2;await assert.rejects(loadReference('/api/reference/',f.get),/manifest/i);
 f.manifest.schema_version=1;f.manifest.schemas.public.sha256='invalid';await assert.rejects(loadReference('/api/reference/',f.get),/manifest/i);
});
test('Swagger is documentation only, with no validator, requests, remote config or credential persistence',()=>{
 const options=swaggerOptions({paths:{}}); assert.equal(options.validatorUrl,null); assert.deepEqual(options.supportedSubmitMethods,[]); assert.equal(options.persistAuthorization,false); assert.equal(options.queryConfigEnabled,false); assert.equal(options.filter,true);
 assert.throws(()=>options.requestInterceptor({url:'https://example.invalid'}),/disabled/);
});
