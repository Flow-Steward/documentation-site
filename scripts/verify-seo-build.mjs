import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root = new URL('../build/', import.meta.url);
const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname.replace(/\/$/, ''));
assert.ok(!locations.includes('/search'), 'Search must be excluded from the documentation sitemap');
const search = await readFile(new URL('search/index.html', root), 'utf8');
assert.ok([...search.matchAll(/<meta\b[^>]*>/g)].some(([tag]) => /name=(?:"robots"|robots(?=[\s>]))/.test(tag) && /content="noindex, follow"/.test(tag)), 'Search needs server-rendered name=robots noindex,follow');
for (const page of ['index.html', 'docs/intro/index.html', 'search/index.html']) {
  const html = await readFile(new URL(page, root), 'utf8');
  assert.ok(!/href=(?:"https:\/\/flowsteward\.org\/blog\/?"|https:\/\/flowsteward\.org\/blog\/?(?=[\s>]))/.test(html), `${page} must not link to the unpublished blog`);
}
console.log('PASS documentation sitemap, server-rendered search noindex and no Blog navigation');
