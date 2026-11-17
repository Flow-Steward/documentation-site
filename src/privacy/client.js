import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export function onRouteDidUpdate() {
  if (!ExecutionEnvironment.canUseDOM || document.getElementById('fs-privacy-client')) return;
  const script=document.createElement('script');
  script.id='fs-privacy-client';
  script.type='module';
  script.src='/privacy/docs.js';
  document.head.append(script);
}
