import React, {useEffect, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import SearchBar from '@theme/SearchBar';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {bindSearchDialog} from './controller';
import styles from './styles.module.css';

export default function SearchDialog() {
 const [query, setQuery] = useState('');
 const resultsUrl = useBaseUrl('/search/');
 const trigger = useRef<HTMLButtonElement>(null);
 const dialog = useRef<HTMLDialogElement>(null);
 const controls = useRef<ReturnType<typeof bindSearchDialog> | null>(null);
 const {pathname, search, hash} = useLocation();
 useEffect(() => {
  if (!dialog.current || !trigger.current) return;
  controls.current = bindSearchDialog(dialog.current, trigger.current, setQuery);
  return () => {controls.current?.dispose(); controls.current = null;};
 }, []);
 useEffect(() => {dialog.current?.querySelector('[class*="searchClearButton"]')?.setAttribute('aria-label', 'Clear search');}, [query]);
 useEffect(() => {controls.current?.close();}, [pathname, search, hash]);
 return <>
  <button ref={trigger} type="button" className={styles.trigger} aria-label="Search documentation" aria-haspopup="dialog" aria-controls="documentation-search-dialog">
   <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
   <span>Search</span><kbd>⌘ / Ctrl K</kbd>
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
