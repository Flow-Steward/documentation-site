import React, {useEffect, useRef, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {loadReference, type ApiKind, type Reference} from './data';
import styles from './styles.module.css';

function ReferenceBrowser() {
 const base = useBaseUrl('/api/reference/');
 const [reference, setReference] = useState<Reference | null>(null);
 const [error, setError] = useState('');
 const [kind, setKind] = useState<ApiKind>('public');
 const [retry, setRetry] = useState(0);
 const [renderer, setRenderer] = useState<React.ComponentType<{spec: Record<string, unknown>}> | null>(null);
 const buttons = useRef<(HTMLButtonElement | null)[]>([]);
 useEffect(() => {
  const controller = new AbortController(); let active = true;
  setError(''); setReference(null);
  Promise.all([loadReference(base, fetch, controller.signal), import('./SwaggerRenderer')]).then(([data, module]) => {
   if(active) {setReference(data); setRenderer(() => module.default);}
  }).catch(() => {if(active && !controller.signal.aborted) setError('The released API reference could not be loaded. Retry, or download the schema JSON directly.');});
  return () => {active = false; controller.abort();};
 }, [base, retry]);
 const Renderer = renderer;
 return <section className={styles.reference} aria-label="Released OpenAPI reference">
  <p className={styles.eyebrow}>Released OpenAPI reference</p>
  <p>Browse operations and models from the published release. API execution is disabled here; use the JSON contract with your own installation.</p>
  {error ? <div role="alert"><p>{error}</p><button className="button button--secondary" onClick={() => setRetry(value => value + 1)}>Retry reference</button></div> : null}
  {!reference && !error ? <p role="status">Loading released API reference…</p> : null}
  {reference ? <>
   <p className={styles.metadata}>Release <a href={`https://github.com/Flow-Steward/flow-steward-app/releases/tag/${reference.manifest.release}`}>{reference.manifest.release}</a>{' · '}Revision <a href={`https://github.com/Flow-Steward/flow-steward-app/commit/${reference.manifest.revision}`}><code>{reference.manifest.revision.slice(0, 12)}</code></a></p>
   <div className={styles.tabs} role="tablist" aria-label="API schema" onKeyDown={event => {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const index = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : kind === 'public' ? 1 : 0;
    setKind(index === 0 ? 'public' : 'application'); buttons.current[index]?.focus();
   }}>
    {(['public','application'] as const).map((item,index) => <button key={item} ref={node => {buttons.current[index] = node;}} id={`api-tab-${item}`} role="tab" aria-selected={kind === item} aria-controls="api-schema-panel" tabIndex={kind === item ? 0 : -1} onClick={() => setKind(item)}>{item === 'public' ? 'Public API' : 'Application API'}</button>)}
   </div>
   <div id="api-schema-panel" role="tabpanel" aria-labelledby={`api-tab-${kind}`} tabIndex={0}>
    <p className={styles.metadata}>{reference.manifest.schemas[kind].paths} paths · {reference.manifest.schemas[kind].operations} operations · <a href={`${base}${reference.manifest.schemas[kind].file}`} download>Download {kind === 'public' ? 'Public' : 'Application'} OpenAPI JSON</a></p>
    {Renderer ? <Renderer key={kind} spec={reference[kind]} /> : null}
   </div>
  </> : <p><a href={`${base}openapi-public.json`} download>Public OpenAPI JSON</a> · <a href={`${base}openapi-application.json`} download>Application OpenAPI JSON</a></p>}
 </section>;
}
export default function ApiReference() {
 return <BrowserOnly fallback={<p>Loading released API reference…</p>}>{() => <ReferenceBrowser />}</BrowserOnly>;
}
