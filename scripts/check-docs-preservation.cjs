#!/usr/bin/env node
/**
 * Capture once before a visual transfer, then check the finished production build:
 *   node scripts/check-docs-preservation.cjs --capture /path/to/original
 *   npm run build && node scripts/check-docs-preservation.cjs
 * Optionally inspect another checkout with --site /path/to/checkout.
 * The committed snapshot deliberately includes the original working-tree articles,
 * not just HEAD: unpublished editorial changes must survive the transfer too.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {createRequire, Module} = require('node:module');
const root = path.resolve(__dirname, '..');
const baselineFile = path.join(__dirname, 'docs-preservation-baseline.json');
const requireProject = createRequire(path.join(root, 'package.json'));
const ts = requireProject('typescript');
const cheerio = requireProject('cheerio');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function files(directory, prefix = '') {
  return fs.readdirSync(directory, {withFileTypes: true}).filter(entry => entry.name !== '.DS_Store').flatMap(entry => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? files(path.join(directory, entry.name), relative) : [relative];
  }).sort();
}
function configAt(directory) {
  const filename = path.join(directory, 'docusaurus.config.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(directory);
  loaded._compile(compiled, filename);
  return loaded.exports.default;
}
function sources(directory) {
  const config = configAt(directory);
  // Navigation/footer may be redesigned; the docs/search/routing settings may not.
  const routing = Object.fromEntries(['url', 'baseUrl', 'trailingSlash', 'i18n',
    'presets', 'plugins', 'onBrokenLinks', 'markdown', 'themes'].filter(key => key in config)
    .map(key => [key, config[key]]));
  return {
    articles: Object.fromEntries(files(path.join(directory, 'docs')).map(file =>
      [file, hash(fs.readFileSync(path.join(directory, 'docs', file)))])),
    sidebarSha256: hash(fs.readFileSync(path.join(directory, 'sidebars.ts'))),
    routing,
  };
}
function shell(directory) {
  const $ = cheerio.load(fs.readFileSync(path.join(directory, 'build/docs/intro/index.html'), 'utf8'));
  const destinations = selector => [...new Set($(selector).map((_, el) => $(el).attr('href')).get())].sort();
  return {
    headerDestinations: destinations('.navbar a[href]'),
    footerDestinations: destinations('footer a[href]'),
    pageDestinations: destinations('a[href]'),
  };
}
function built(directory) {
  const config = configAt(directory);
  const build = path.join(directory, 'build');
  assert.ok(fs.existsSync(build), 'Production build is missing; run npm run build first.');
  const buildFiles = new Set(files(build));
  const html = [...buildFiles].filter(file => file.endsWith('.html'));
  const base = config.baseUrl.replace(/\/$/, '');
  const origin = new URL(config.url).origin;
  const route = file => base + '/' + file.replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
  const pages = new Map();
  for (const file of html) {
    const $ = cheerio.load(fs.readFileSync(path.join(build, file), 'utf8'));
    pages.set(file, {url: route(file) || '/', ids: new Set($('[id]').map((_, el) => $(el).attr('id')).get()),
      hrefs: $('a[href],link[rel="canonical"][href]').map((_, el) => $(el).attr('href')).get()});
  }
  const broken = new Set();
  for (const [file, page] of pages) for (const href of page.hrefs) {
    if (/^(?:mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const url = new URL(href, origin + page.url + (file.endsWith('/index.html') ? '/' : ''));
    if (url.origin !== origin) continue;
    const pathname = decodeURIComponent(url.pathname);
    if (base && !pathname.startsWith(base + '/') && pathname !== base) continue;
    const relative = pathname.slice(base.length).replace(/^\//, '').replace(/\/$/, '');
    const target = [relative, relative + '.html', (relative ? relative + '/' : '') + 'index.html'].find(p => buildFiles.has(p));
    const key = `${page.url} -> ${pathname}${url.hash}`;
    if (!target) { broken.add(key); continue; }
    if (url.hash && pages.has(target)) {
      let id;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch { id = url.hash.slice(1); }
      if (id && !pages.get(target).ids.has(id) && !id.startsWith(':~:text=')) broken.add(key);
    }
  }
  return {routes: [...pages.values()].map(page => page.url).sort(), brokenLinks: [...broken].sort()};
}
if (process.argv[2] === '--capture') {
  assert.ok(process.argv[3], 'Supply the original documentation directory.');
  assert.ok(!fs.existsSync(baselineFile), 'Baseline already exists; refusing to overwrite the pre-transfer evidence.');
  const original = path.resolve(process.argv[3]);
  const {headerDestinations, footerDestinations} = shell(original);
  const snapshot = {...sources(original), ...built(original), headerDestinations, footerDestinations};
  fs.writeFileSync(baselineFile, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Captured ${Object.keys(snapshot.articles).length} docs files, ${snapshot.routes.length} built routes, ${snapshot.brokenLinks.length} existing broken links.`);
} else {
  const site = process.argv[2] === '--site' ? path.resolve(process.argv[3]) : root;
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const current = sources(site);
  assert.deepEqual(current.articles, baseline.articles, 'Article files or bytes changed (including frontmatter, slugs, and editorial changes).');
  assert.equal(current.sidebarSha256, baseline.sidebarSha256, 'Sidebar ordering, categories, or destinations changed.');
  assert.deepEqual(current.routing, baseline.routing, 'Documentation routing/search configuration changed.');
  const production = built(site);
  const lostRoutes = baseline.routes.filter(route => !production.routes.includes(route));
  assert.deepEqual(lostRoutes, [], 'Previously published routes disappeared.');
  const newBrokenLinks = production.brokenLinks.filter(link => !baseline.brokenLinks.includes(link));
  assert.deepEqual(newBrokenLinks, [], 'New broken production links or heading anchors found.');
  const navigation = shell(site);
  assert.deepEqual(baseline.headerDestinations.filter(href => !navigation.pageDestinations.includes(href)), [],
    'An original header destination is no longer linked from the documentation entry page.');
  assert.deepEqual(baseline.footerDestinations.filter(href => !navigation.footerDestinations.includes(href)), [],
    'An original footer destination disappeared from the footer.');
  console.log(`PASS: ${Object.keys(current.articles).length} docs files byte-identical; sidebars and routing/search unchanged; ${baseline.routes.length} published routes retained; no new broken internal links or anchors.`);
  console.log(`PASS: ${baseline.headerDestinations.length} original header destinations remain linked; ${baseline.footerDestinations.length} original footer destinations retained in the footer.`);
  if (production.brokenLinks.length) console.log(`Existing baseline link issues still present: ${production.brokenLinks.length} (listed in ${path.relative(root, baselineFile)}).`);
}
