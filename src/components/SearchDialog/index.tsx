import React, {useEffect, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import SearchBar from '@theme/SearchBar';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {bindSearchDialog} from './controller';
import styles from './styles.module.css';

export default function SearchDialog() {
 const [query, setQuery] = useState('');
 const [shortcut, setShortcut] = useState('Ctrl K');
 const resultsUrl = useBaseUrl('/search/');
 const trigger = useRef<HTMLButtonElement>(null);
 const dialog = useRef<HTMLDialogElement>(null);
 const controls = useRef<ReturnType<typeof bindSearchDialog> | null>(null);
 const {pathname, search, hash} = useLocation();
 useEffect(() => {
  if (!dialog.current || !trigger.current) return;
  controls.current = bindSearchDialog(dialog.current, trigger.current, setQuery);
  setShortcut(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || '') ? '⌘K' : 'Ctrl K');
  const openSearch = () => controls.current?.open(true);
  document.addEventListener('fs:open-docs-search', openSearch);
  return () => {document.removeEventListener('fs:open-docs-search', openSearch); controls.current?.dispose(); controls.current = null;};
 }, []);
 useEffect(() => {dialog.current?.querySelector('[class*="searchClearButton"]')?.setAttribute('aria-label', 'Clear search');}, [query]);
 useEffect(() => {controls.current?.close();}, [pathname, search, hash]);
 return <>
  <button ref={trigger} type="button" className={styles.trigger} aria-label={`Search documentation (${shortcut})`} title={`Search (${shortcut})`} aria-haspopup="dialog" aria-controls="documentation-search-dialog">
   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
   <span>Search</span><kbd>{shortcut}</kbd>
  </button>
  <dialog ref={dialog} id="documentation-search-dialog" className={styles.dialog} aria-labelledby="documentation-search-heading">
   <h2 id="documentation-search-heading" className={styles.hiddenLabel}>Search documentation</h2>
   <div className={styles.search}
     onMouseDownCapture={event => {if ((event.target as Element).closest('[class*="searchClearButton"]')) event.preventDefault();}}
     onChangeCapture={event => {if (event.target instanceof HTMLInputElement) setQuery(event.target.value);}}
     onClickCapture={event => {if ((event.target as Element).closest('[class*="searchClearButton"]')) {setQuery(''); queueMicrotask(() => dialog.current?.querySelector<HTMLInputElement>('input')?.focus());}}}>
    <SearchBar />
    <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4-4"/></svg>
    <button className={styles.close} type="button" aria-label="Close search" onClick={() => controls.current?.close()}><kbd>Esc</kbd></button>
   </div>
   <div className={styles.help}>
    <span><kbd>↑</kbd><kbd>↓</kbd>to move</span><span><kbd>↵</kbd>to open</span><span><kbd>Esc</kbd>to close</span>
    <Link className={styles.allResults} to={`${resultsUrl}?${new URLSearchParams({q: query.trim()})}`} aria-disabled={!query.trim()} onMouseDown={event => event.preventDefault()}
      onClick={event => {if (!query.trim()) event.preventDefault();}}>All results ↗</Link>
   </div>
  </dialog>
 </>;
}
