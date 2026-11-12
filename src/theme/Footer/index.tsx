import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useThemeConfig} from '@docusaurus/theme-common';
import styles from './styles.module.css';
type FooterItem = {label?: string; to?: string; href?: string};

export default function Footer(): ReactNode {
  const {footer} = useThemeConfig();
  const groups = (footer?.links ?? []) as Array<{items?: FooterItem[]}>;
  return <footer className={styles.footer}>
    <div className={styles.inner}><div className={styles.main}>
      <div className={styles.brand}><Link to="https://flowsteward.org/" aria-label="Flow Steward home"><img src={useBaseUrl('/img/flow-steward-logo.svg')} width="175" height="28" alt="Flow Steward" /></Link><p>Agent-built.<br />Human-approved.</p></div>
      <div className={styles.columns}>
        <nav aria-label="Product"><h2>Product</h2>{[['Quick start','/docs/user/getting-started'],['Docs','/docs/intro'],['Workflow Library','https://flowsteward.org/workflows/'],['Extension Registry','https://flowsteward.org/extensions/'],['MCP servers','https://flowsteward.org/mcp/'],['Blog & tutorials','https://flowsteward.org/blog/']].map(([label,to])=><Link key={to} to={to}>{label}</Link>)}</nav>
        <nav aria-label="Documentation"><h2>Documentation</h2>{groups.slice(0,2).flatMap(group=>group.items ?? []).map((item,i)=><Link key={i} to={item.to || item.href || '#'}>{item.label}</Link>)}</nav>
        <nav aria-label="Resources"><h2>Resources</h2>{groups.slice(2).flatMap(group=>group.items ?? []).map((item,i)=><Link key={i} to={item.to || item.href || '#'}>{item.label}</Link>)}<a href="https://github.com/Flow-Steward/flow-steward-app">GitHub</a></nav>
      </div>
    </div><div className={styles.bottom}><span>© {new Date().getFullYear()} Flow Steward contributors · License: <a href="https://github.com/Flow-Steward/flow-steward-app/blob/main/LICENSE">Apache-2.0</a></span><span><img src={useBaseUrl('/img/eu-flag.svg')} alt="European Union flag" width="16" height="12" /> Built in Lithuania, EU</span></div></div>
  </footer>;
}
