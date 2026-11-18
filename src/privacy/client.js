import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export function onRouteDidUpdate() {
  if (!ExecutionEnvironment.canUseDOM || document.getElementById('fs-privacy-client')) return;
  const script=document.createElement('script');
  script.id='fs-privacy-client';
  script.type='module';
  script.src='/privacy/docs.js?v=1.1.0';
  document.head.append(script);
}
