import React, {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useLocation} from '@docusaurus/router';
import SearchBar from '@theme/SearchBar';
import styles from './styles.module.css';

const links = [
  ['Docs', '/docs/intro'], ['Workflows', 'https://flowsteward.org/workflows/'],
  ['Extensions', 'https://flowsteward.org/extensions/'], ['MCP', 'https://flowsteward.org/mcp/'],
  ['Features', 'https://flowsteward.org/features/'], ['Blog', 'https://flowsteward.org/blog/'],
];
export default function Navbar(): ReactNode {
  const menu = useRef<HTMLDialogElement>(null);
  const {pathname} = useLocation();
  const logo = useBaseUrl('/img/flow-steward-logo.svg');
  useEffect(() => {menu.current?.close();}, [pathname]);
  const navigation = <>{links.map(([label, href]) => <Link key={label} to={href} aria-current={label === 'Docs' ? 'page' : undefined}>{label}</Link>)}</>;
  return <header className={`navbar ${styles.header}`}>
    <div className={styles.inner}>
      <Link className={styles.logo} to="https://flowsteward.org/" aria-label="Flow Steward home"><img src={logo} alt="Flow Steward" width="175" height="28" /></Link>
      <nav className={styles.primary} aria-label="Primary">{navigation}</nav>
      <div className={styles.actions}>
        <div className={styles.search}><SearchBar /></div>
        <a className={styles.github} href="https://github.com/Flow-Steward/flow-steward-app" aria-label="Flow Steward on GitHub"><img src={useBaseUrl('/img/github.svg')} alt="" width="20" height="20" /></a>
        <Link className={styles.start} to="/docs/user/getting-started">Quick start</Link>
        <button className={styles.menuButton} type="button" aria-label="Open main menu" aria-haspopup="dialog" onClick={() => menu.current?.showModal()}><img src={useBaseUrl('/img/menu.svg')} alt="" width="20" height="20" /></button>
      </div>
    </div>
    <dialog ref={menu} className={styles.dialog} aria-label="Main menu" onClick={e => {if (e.target === e.currentTarget) menu.current?.close();}}>
      <div className={styles.menuHeading}><span>Flow Steward</span><button type="button" aria-label="Close main menu" onClick={() => menu.current?.close()}>×</button></div>
      <nav aria-label="Primary mobile" onClick={e => {if ((e.target as HTMLElement).closest('a')) menu.current?.close();}}>{navigation}<Link to="/docs/user/getting-started">Quick start</Link><a href="https://github.com/Flow-Steward/flow-steward-app">GitHub</a></nav>
    </dialog>
  </header>;
}
