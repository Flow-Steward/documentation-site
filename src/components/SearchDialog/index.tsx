import React, {useEffect, useRef} from 'react';
import {useLocation} from '@docusaurus/router';
import SearchBar from '@theme/SearchBar';
import {bindSearchDialog} from './controller';
import styles from './styles.module.css';

export default function SearchDialog() {
 const trigger = useRef<HTMLButtonElement>(null);
 const dialog = useRef<HTMLDialogElement>(null);
 const controls = useRef<ReturnType<typeof bindSearchDialog> | null>(null);
 const {pathname, search, hash} = useLocation();
 useEffect(() => {
  if (!dialog.current || !trigger.current) return;
  controls.current = bindSearchDialog(dialog.current, trigger.current);
  return () => {controls.current?.dispose(); controls.current = null;};
 }, []);
 useEffect(() => {controls.current?.close();}, [pathname, search, hash]);
 return <>
  <button ref={trigger} type="button" className={styles.trigger} aria-label="Search documentation" aria-haspopup="dialog" aria-controls="documentation-search-dialog">
   <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
   <span>Search</span><kbd>⌘ / Ctrl K</kbd>
  </button>
  <dialog ref={dialog} id="documentation-search-dialog" className={styles.dialog} aria-labelledby="documentation-search-heading">
   <div className={styles.heading}><h2 id="documentation-search-heading">Search documentation</h2><button type="button" aria-label="Close search" onClick={() => controls.current?.close()}>×</button></div>
   <div className={styles.search}><SearchBar /></div>
   <p className={styles.help}><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></p>
  </dialog>
 </>;
}
