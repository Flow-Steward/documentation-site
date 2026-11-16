import React, {type ReactNode, useEffect, useRef} from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type {Props} from '@theme/TOC';
import styles from './styles.module.css';
import {activeClass, mountRail} from './rail';

export default function TOC({className, ...props}: Props): ReactNode {
  const navigation = useRef<HTMLElement>(null);
  const base = useRef<SVGPathElement>(null);
  const active = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!navigation.current || !base.current || !active.current) return undefined;
    return mountRail(navigation.current, base.current, active.current);
  }, [props.toc, props.minHeadingLevel, props.maxHeadingLevel]);

  return (
    <aside className={clsx(styles.tableOfContents, 'thin-scrollbar', className)} aria-label="On this page">
      <div className={styles.title}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h12M3 18h16" /></svg>
        <span>On this page</span>
      </div>
      <nav ref={navigation} className={styles.navigation}>
        <svg className={styles.rail} width="16" height="100%" aria-hidden="true">
          <path ref={base} className={styles.baseRail} />
          <path ref={active} className={styles.activeRail} />
        </svg>
        <TOCItems {...props} className="table-of-contents" linkClassName="table-of-contents__link toc-highlight" linkActiveClassName={activeClass} />
      </nav>
    </aside>
  );
}
