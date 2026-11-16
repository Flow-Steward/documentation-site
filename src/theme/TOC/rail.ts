export const activeClass = 'table-of-contents__link--active';
const transition = 'stroke-dasharray .4s cubic-bezier(.22,1,.36,1),stroke-dashoffset .4s cubic-bezier(.22,1,.36,1)';

/** Fit the prototype's continuous rail to Docusaurus's native TOC links. */
export function mountRail(nav: HTMLElement, base: SVGPathElement, active: SVGPathElement): () => void {
  let frame = 0;
  let disposed = false;
  let fitted = false;
  let signature = '';
  let starts: number[] = [];
  let ends: number[] = [];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const fit = () => {
    frame = 0;
    if (disposed) return;
    const bounds = nav.getBoundingClientRect();
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('a.toc-highlight')];
    if (!bounds.height || !links.length) {
      active.style.transition = 'none';
      active.style.strokeDasharray = '0 99999';
      fitted = false;
      return;
    }
    const rows = links.map(link => {
      let depth = 0;
      let parent = link.parentElement?.parentElement;
      while (parent && parent !== nav) {
        if (parent.tagName === 'UL') depth++;
        parent = parent.parentElement;
      }
      const rect = link.getBoundingClientRect();
      return {x: 1.5 + Math.max(0, depth - 1) * 12, t: rect.top - bounds.top, b: rect.bottom - bounds.top};
    });
    const nextSignature = rows.map(p => `${p.x}:${p.t}:${p.b}`).join('|');
    if (nextSignature !== signature) {
      signature = nextSignature;
      const radius = 7;
      let path = `M${rows[0].x} ${rows[0].t}`;
      starts = [];
      ends = [];
      const length = () => {
        active.setAttribute('d', path);
        return active.getTotalLength();
      };
      rows.forEach((p, i) => {
        const next = rows[i + 1];
        const turn = next && next.x !== p.x;
        starts.push(length());
        path += ` L${p.x} ${turn ? p.b - radius : p.b}`;
        ends.push(length());
        if (turn) path += ` C${p.x} ${p.b} ${next.x} ${p.b} ${next.x} ${p.b + radius}`;
      });
      base.setAttribute('d', path);
      active.setAttribute('d', path);
    }
    const index = links.findIndex(link => link.classList.contains(activeClass));
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    active.style.transition = fitted && !motion.matches ? transition : 'none';
    if (index < 0 || starts[index] == null) {
      active.style.strokeDasharray = '0 99999';
    } else {
      active.style.strokeDasharray = `${(ends[index] - starts[index]).toFixed(1)} 99999`;
      active.style.strokeDashoffset = (-starts[index]).toFixed(1);
    }
    fitted = true;
  };
  const schedule = () => {
    if (!disposed && !frame) frame = window.requestAnimationFrame(fit);
  };
  const mutations = new MutationObserver(schedule);
  // Observe native heading selection, never select headings or intercept clicks.
  mutations.observe(nav, {subtree: true, attributes: true, attributeFilter: ['class'], childList: true});
  const resize = new ResizeObserver(schedule);
  resize.observe(nav);
  window.addEventListener('resize', schedule);
  motion.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
  return () => {
    disposed = true;
    window.cancelAnimationFrame(frame);
    mutations.disconnect();
    resize.disconnect();
    window.removeEventListener('resize', schedule);
    motion.removeEventListener('change', schedule);
  };
}
