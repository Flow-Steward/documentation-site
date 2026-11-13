import React, {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type {Props} from '@theme/TOC';
import styles from './styles.module.css';

const activeClass = 'table-of-contents__link--active';
type Rail = {path: string; height: number; x: number; y: number; activeHeight: number};

export default function TOC({className, ...props}: Props): ReactNode {
  const navigation = useRef<HTMLElement>(null);
  const [rail, setRail] = useState<Rail>({path: '', height: 0, x: 0, y: 0, activeHeight: 0});

  useEffect(() => {
    const nav = navigation.current;
    if (!nav) return undefined;
    let frame = 0;
    const measure = () => {
      const bounds = nav.getBoundingClientRect();
      const links = [...nav.querySelectorAll<HTMLAnchorElement>('a.toc-highlight')];
      if (!bounds.height || !links.length) return;
      const rows = links.map(link => {
        let depth = 0;
        let parent = link.parentElement?.parentElement;
        while (parent && parent !== nav) {
          if (parent.tagName === 'UL') depth++;
          parent = parent.parentElement;
        }
        const rect = link.getBoundingClientRect();
        return {link, x: 2 + Math.max(0, depth - 1) * 12, top: rect.top - bounds.top, bottom: rect.bottom - bounds.top};
      });
      let path = `M${rows[0].x} ${rows[0].top}`;
      rows.forEach((row, index) => {
        if (index) {
          const previous = rows[index - 1];
          const middle = (previous.bottom + row.top) / 2;
          if (previous.x !== row.x) path += ` L${previous.x} ${middle - 5} C${previous.x} ${middle},${row.x} ${middle},${row.x} ${middle + 5}`;
          else path += ` L${row.x} ${row.top}`;
        }
        path += ` L${row.x} ${row.bottom}`;
      });
      const active = rows.find(row => row.link.classList.contains(activeClass));
      rows.forEach(row => {
        if (row === active) row.link.setAttribute('aria-current', 'location');
        else row.link.removeAttribute('aria-current');
      });
      setRail({path, height: bounds.height, x: active?.x ?? 2, y: active?.top ?? 0, activeHeight: active ? active.bottom - active.top : 0});
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const mutations = new MutationObserver(schedule);
    mutations.observe(nav, {subtree: true, attributes: true, attributeFilter: ['class'], childList: true});
    const resize = new ResizeObserver(schedule);
    resize.observe(nav);
    document.fonts?.ready.then(schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); mutations.disconnect(); resize.disconnect(); };
  }, [props.toc]);

  return (
    <aside className={clsx(styles.tableOfContents, 'thin-scrollbar', className)} aria-label="On this page">
      <div className={styles.title}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h12M3 18h16" /></svg>
        <span>On this page</span>
      </div>
      <nav ref={navigation} className={styles.navigation}>
        <svg className={styles.rail} width="40" height={rail.height} aria-hidden="true"><path d={rail.path} /></svg>
        <span className={styles.activeRail} aria-hidden="true" style={{transform: `translate(${rail.x}px, ${rail.y}px)`, height: rail.activeHeight}} />
        <TOCItems {...props} className="table-of-contents" linkClassName="table-of-contents__link toc-highlight" linkActiveClassName={activeClass} />
      </nav>
    </aside>
  );
}
