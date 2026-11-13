import React, {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem} from '@docusaurus/plugin-content-docs';
import {useLocation} from '@docusaurus/router';
import {ThemeClassNames} from '@docusaurus/theme-common';
import BackToTopButton from '@theme/BackToTopButton';
import DocRootLayoutMain from '@theme/DocRoot/Layout/Main';
import DocSidebarItems from '@theme/DocSidebarItems';
import type {Props} from '@theme/DocRoot/Layout';
import styles from './styles.module.css';

function currentLabel(items: readonly PropSidebarItem[], path: string): string | undefined {
  for (const item of items) {
    if ((item.type === 'link' || item.type === 'category') &&
        item.href?.replace(/\/$/, '') === path.replace(/\/$/, '')) return item.label;
    if (item.type === 'category') {
      const label = currentLabel(item.items, path);
      if (label) return label;
    }
  }
  return undefined;
}

export default function DocRootLayout({children}: Props): ReactNode {
  const sidebar = useDocsSidebar();
  const {pathname} = useLocation();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const mobileNavigation = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      // Let native modal dialogs handle Escape before the docs disclosure.
      if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!mobileNavigation.current?.contains(event.target as Node)) setOpen(false);
    };
    const breakpoint = window.matchMedia('(min-width: 860px)');
    const closeOnDesktop = () => { if (breakpoint.matches) setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    breakpoint.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
      breakpoint.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);

  const menu = (mobile: boolean) => sidebar && (
    <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
      <DocSidebarItems
        items={sidebar.items}
        activePath={pathname}
        level={1}
        onItemClick={mobile ? (item) => {
          if (item.type === 'link' || (item.type === 'category' && item.href)) {
            setOpen(false);
            trigger.current?.focus();
          }
        } : undefined}
      />
    </ul>
  );

  return (
    <div className={clsx(styles.docsWrapper, 'fs-docs-layout')}>
      <BackToTopButton />
      {sidebar && <div ref={mobileNavigation} className={styles.mobileNavigation}>
        <button
          ref={trigger}
          type="button"
          className={styles.mobileTrigger}
          aria-expanded={open}
          aria-controls="docs-mobile-navigation"
          onClick={() => setOpen(!open)}>
          <span className={styles.docsLabel}>Docs</span>
          <span className={styles.currentLabel}>{currentLabel(sidebar.items, pathname) ?? 'Documentation'}</span>
          <svg className={clsx(styles.chevron, open && styles.chevronOpen)} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <nav id="docs-mobile-navigation" aria-label="Docs pages" hidden={!open} className={clsx(styles.mobileMenu, 'menu thin-scrollbar')}>
          {open && menu(true)}
        </nav>
      </div>}
      <div className={clsx(styles.docRoot, 'fs-docs-root')}>
        {sidebar && <aside className={clsx(styles.sidebar, ThemeClassNames.docs.docSidebarContainer, 'fs-docs-sidebar')}>
          <nav aria-label="Docs pages" className="menu thin-scrollbar">{menu(false)}</nav>
        </aside>}
        <DocRootLayoutMain hiddenSidebarContainer={false}>{children}</DocRootLayoutMain>
      </div>
    </div>
  );
}
