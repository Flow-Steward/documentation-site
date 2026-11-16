import assert from 'node:assert/strict';
import test from 'node:test';
import {mountRail} from '../src/theme/TOC/rail.ts';

// Numerically integrate the cubic to provide an independent SVG-length oracle.
function pathLength(path) {
  const tokens = path.match(/[MLC]|-?\d+(?:\.\d+)?/g);
  let index = 0, x = 0, y = 0, length = 0;
  while (index < tokens.length) {
    const command = tokens[index++];
    const number = () => Number(tokens[index++]);
    if (command === 'M') { x = number(); y = number(); }
    else if (command === 'L') {
      const nx = number(), ny = number(); length += Math.hypot(nx - x, ny - y); x = nx; y = ny;
    } else if (command === 'C') {
      const x1 = number(), y1 = number(), x2 = number(), y2 = number(), nx = number(), ny = number();
      let previousX = x, previousY = y;
      for (let step = 1; step <= 1000; step++) {
        const t = step / 1000, u = 1 - t;
        const px = u ** 3 * x + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * nx;
        const py = u ** 3 * y + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * ny;
        length += Math.hypot(px - previousX, py - previousY); previousX = px; previousY = py;
      }
      x = nx; y = ny;
    } else throw new Error(`Unexpected path command ${command}`);
  }
  return length;
}

function fixture() {
  const frames = new Map(); let nextFrame = 0;
  const events = new Map(); const observers = [];
  let resolveFonts;
  const fonts = new Promise(resolve => { resolveFonts = resolve; });
  const reducedMotion = {matches: false, addEventListener() {}, removeEventListener() {}};
  globalThis.window = {
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
    matchMedia() { return reducedMotion; },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name) { events.delete(name); },
  };
  globalThis.document = {fonts: {ready: fonts}};
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  globalThis.MutationObserver = Observer;
  globalThis.ResizeObserver = Observer;
  const rootList = {tagName: 'UL'};
  const nestedList = {tagName: 'UL', parentElement: rootList};
  const links = [0, 1, 2, 3].map((_, index) => ({
    top: index * 32, height: 32, active: index === 0, attributes: {},
    parentElement: {parentElement: index === 1 || index === 2 ? nestedList : rootList},
    getBoundingClientRect() { return {top: 100 + this.top, bottom: 100 + this.top + this.height}; },
    classList: {contains() { return links[index].active; }},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
  }));
  const nav = {querySelectorAll: () => links, getBoundingClientRect: () => ({top: 100, height: 128})};
  rootList.parentElement = nav;
  const base = {attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }};
  let measurements = 0;
  const active = {...base, attributes: {}, style: {}, getTotalLength() {
    measurements++;
    return pathLength(this.attributes.d);
  }};
  const flush = () => { const queued = [...frames.values()]; frames.clear(); queued.forEach(callback => callback()); };
  return {nav, base, active, links, frames, events, observers, reducedMotion, resolveFonts, flush, measurements: () => measurements};
}

test('ports the prototype path, measuring each row before and after its segment', () => {
  const f = fixture(); const cleanup = mountRail(f.nav, f.base, f.active); f.flush();
  assert.equal(f.base.attributes.d, 'M1.5 0 L1.5 25 C1.5 32 13.5 32 13.5 39 L13.5 64 L13.5 89 C13.5 96 1.5 96 1.5 103 L1.5 128');
  assert.equal(f.active.attributes.d, f.base.attributes.d);
  assert.equal(f.measurements(), 8);
  assert.equal(f.active.style.strokeDasharray, '25.0 99999');
  assert.equal(f.active.style.strokeDashoffset, '0.0');
  assert.equal(f.active.style.transition, 'none');
  assert.equal(f.links[0].attributes['aria-current'], 'location');
  cleanup();
});

test('native active-class changes animate the same path without rebuilding it or intercepting anchors', () => {
  const f = fixture(); const cleanup = mountRail(f.nav, f.base, f.active); f.flush();
  f.links[0].active = false; f.links[2].active = true;
  f.observers[0].callback(); f.observers[0].callback();
  assert.equal(f.frames.size, 1); f.flush();
  assert.equal(f.measurements(), 8);
  assert.equal(f.active.style.strokeDashoffset, (-pathLength('M1.5 0 L1.5 25 C1.5 32 13.5 32 13.5 39 L13.5 64')).toFixed(1));
  assert.match(f.active.style.transition, /stroke-dasharray .4s cubic-bezier\(.22,1,.36,1\),stroke-dashoffset/);
  assert.equal(f.links[0].attributes['aria-current'], undefined);
  assert.equal(f.links[2].attributes['aria-current'], 'location');
  assert.equal(f.events.has('click'), false);
  cleanup();
});

test('recalculates wrapped rows after resize and fonts, using the actual rendered height', async () => {
  const f = fixture(); const cleanup = mountRail(f.nav, f.base, f.active); f.flush();
  f.links[1].height = 52; f.links[2].top += 20; f.links[3].top += 20;
  f.observers[1].callback(); f.flush();
  assert.match(f.base.attributes.d, /L13.5 84 L13.5 109 C13.5 116 1.5 116 1.5 123 L1.5 148/);
  assert.equal(f.active.attributes.d, f.base.attributes.d);
  assert.equal(f.measurements(), 16);
  f.resolveFonts(); await Promise.resolve(); assert.equal(f.frames.size, 1); f.flush();
  cleanup();
});

test('reduced motion and no active heading suppress animation and hide the segment', () => {
  const f = fixture(); const cleanup = mountRail(f.nav, f.base, f.active); f.flush();
  f.reducedMotion.matches = true; f.links[0].active = false;
  f.observers[0].callback(); f.flush();
  assert.equal(f.active.style.transition, 'none');
  assert.equal(f.active.style.strokeDasharray, '0 99999');
  cleanup();
});

test('unmount cancels queued frames and prevents late font promises from scheduling work', async () => {
  const f = fixture(); const cleanup = mountRail(f.nav, f.base, f.active);
  assert.equal(f.frames.size, 1); cleanup();
  assert.equal(f.frames.size, 0); assert.ok(f.observers.every(observer => observer.disconnected));
  assert.equal(f.events.size, 0);
  f.resolveFonts(); await Promise.resolve(); assert.equal(f.frames.size, 0);
});
