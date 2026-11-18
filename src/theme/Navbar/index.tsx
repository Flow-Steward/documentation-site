import React, {useEffect, useRef, useState, type ReactNode, type CSSProperties} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useLocation} from '@docusaurus/router';
import SearchDialog from '@site/src/components/SearchDialog';
import {mountFluid} from './fluid-button';
import {mountGlow} from './glow';
import styles from './styles.module.css';

const repository = 'https://github.com/Flow-Steward/flow-steward-app';
const links = [['Docs', '/docs/intro'], ['Workflows', 'https://flowsteward.org/workflows/'], ['Extensions', 'https://flowsteward.org/extensions/'], ['MCP', 'https://flowsteward.org/mcp/'], ['Features', 'https://flowsteward.org/features/']];
const SearchIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
export default function Navbar(): ReactNode {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const releaseMenuLock = useRef<(() => void) | null>(null);
  const {pathname} = useLocation();
  const logo = useBaseUrl('/img/flow-steward-logo.svg');
  const github = useBaseUrl('/img/github.svg');
  const closeMenu = (restoreFocus = false) => {releaseMenuLock.current?.(); releaseMenuLock.current = null; setOpen(false); if (restoreFocus) trigger.current?.focus();};
  useEffect(() => {setOpen(false);}, [pathname]);
  useEffect(() => {
    if (!root.current) return;
    const stopFluid = mountFluid(root.current);
    const stopGlow = mountGlow(root.current);
    return () => {stopGlow(); stopFluid();};
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    let released = false;
    const restoreOverflow = () => {if (!released) {document.documentElement.style.overflow = previous; released = true;}};
    releaseMenuLock.current = restoreOverflow;
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {event.preventDefault(); closeMenu(true);}
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') closeMenu();
      if (event.key === 'Tab') {
        const controls = [trigger.current, ...Array.from(menu.current?.querySelectorAll<HTMLElement>('a, button') ?? [])].filter(Boolean) as HTMLElement[];
        const index = controls.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) {event.preventDefault(); controls.at(-1)?.focus();}
        else if (!event.shiftKey && index === controls.length - 1) {event.preventDefault(); controls[0]?.focus();}
      }
    };
    const desktop = window.matchMedia('(min-width: 960px)');
    const onDesktop = () => {if(desktop.matches) closeMenu();};
    window.addEventListener('keydown', onKey, true); desktop.addEventListener('change', onDesktop);
    return () => {restoreOverflow(); releaseMenuLock.current = null; window.removeEventListener('keydown', onKey, true); desktop.removeEventListener('change', onDesktop);};
  }, [open]);
  const openSearch = () => {
    closeMenu();
    requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('fs:open-docs-search')));
  };
  const quickstart = (className: string) => <Link className={className} to="/docs/user/getting-started" data-fs-glow="" data-fs-fluid="flood"><span className={styles.startBackground} aria-hidden="true"/>Quick start</Link>;
  return <div ref={root} style={{display:'contents'}}>
    <header className={`navbar ${styles.header}`}>
      <div className={styles.inner}>
        <Link className={styles.logo} to="https://flowsteward.org/" target="_self" aria-label="Flow Steward home"><img src={logo} alt="Flow Steward" width="175" height="28" /></Link>
        <nav className={styles.primary} aria-label="Primary">{links.map(([label, href]) => <Link key={label} to={href} target="_self" aria-current={label === 'Docs' ? 'page' : undefined}>{label}</Link>)}</nav>
        <div className={styles.actions}>
          <div className={styles.search}><SearchDialog /></div>
          <a className={styles.github} href={repository} target="_blank" rel="noopener" title="GitHub" aria-label="Flow Steward on GitHub"><img src={github} alt="" width="18" height="18" /></a>
          {quickstart(styles.start)}
          <button ref={trigger} className={styles.menuButton} type="button" aria-label={open ? 'Close main menu' : 'Open main menu'} aria-expanded={open} aria-controls="site-mobile-navigation" onClick={() => setOpen(!open)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{open ? <path d="M18 6 6 18M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}</svg>
          </button>
        </div>
      </div>
    </header>
    <nav ref={menu} id="site-mobile-navigation" className={styles.mobileMenu} aria-label="Primary mobile" hidden={!open}>
      <button className={styles.menuSearch} type="button" onClick={openSearch}><SearchIcon/><span>Search templates, extensions, docs…</span></button>
      <ul>{links.map(([label, href], index) => <li key={label} style={{'--menu-index':index} as CSSProperties}><Link to={href} target="_self" aria-current={label === 'Docs' ? 'page' : undefined} onClick={() => closeMenu()}>{label}<span aria-hidden="true">›</span></Link></li>)}</ul>
      <div className={styles.menuActions}><a href={repository} target="_blank" rel="noopener">GitHub <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a><a href={`${repository}/releases`} target="_blank" rel="noopener">Releases <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a></div>
    </nav>
    <div className={styles.mobileStart}>{quickstart(styles.mobileStartLink)}</div>
  </div>;
}
