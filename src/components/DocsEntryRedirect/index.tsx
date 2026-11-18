import type {ReactNode} from 'react';
import Head from '@docusaurus/Head';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/** Keep old entry URLs usable without adding a category to docs pagination. */
export default function DocsEntryRedirect(): ReactNode {
  const target = useBaseUrl('/docs/intro');
  const {siteConfig} = useDocusaurusContext();
  return <>
    <Head>
      <title>Flow Steward Documentation</title>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <meta name="robots" content="noindex, follow" />
      <link rel="canonical" href={`${siteConfig.url}${target}`} />
    </Head>
    <Redirect to={target} />
    <p>Continue to <a href={target}>Flow Steward documentation</a>.</p>
  </>;
}
