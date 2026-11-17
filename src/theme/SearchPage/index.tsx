import React, {type ComponentProps} from 'react';
import Head from '@docusaurus/Head';
import OriginalSearchPage from '@theme-original/SearchPage';

export default function SearchPage(props: ComponentProps<typeof OriginalSearchPage>) {
  return <><Head><meta name="robots" content="noindex, follow" /></Head><OriginalSearchPage {...props} /></>;
}
