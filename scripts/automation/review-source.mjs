// Read-only, bounded source retrieval for page reviewers. Never executes product code.
import {readFileSync, lstatSync, realpathSync} from 'node:fs';
import {resolve, relative, extname} from 'node:path';

const root = realpathSync(resolve('../product'));
const [command, query, start = '1'] = process.argv.slice(2);
const extensions = new Set(['.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.sql', '.md', '.mdx', '.sh', '.json', '.yml', '.yaml', '.toml', '.ini', '.conf', '.html', '.css']);
const excluded = /(?:^|\/)(?:node_modules|vendor|vendors|dist|build|coverage|logs|backups|\.git)(?:\/|$)|(?:\.min\.(?:js|css)|(?:package-lock|pnpm-lock|yarn\.lock)|\.map)$/i;
const inventory = JSON.parse(readFileSync('../automation-context/source-paths.json', 'utf8'));
if (!Array.isArray(inventory) || inventory.length > 10000 || inventory.some(path => typeof path !== 'string' || path.startsWith('/') || path.split('/').some(part => !part || part === '..' || part === '.'))) throw new Error('invalid prepared source inventory');
const files = inventory.filter(path => !excluded.test(path) && (extensions.has(extname(path)) || /(?:^|\/)(?:Dockerfile|VERSION|Makefile|\.env\.example[^/]*|requirements[^/]*\.(?:txt|lock))$/.test(path))).sort();
function contents(path) {
  if (!files.includes(path)) throw new Error('path is outside the supported tracked source set');
  const absolute = resolve(root, path);
  const canonical = realpathSync(absolute);
  if (relative(root, canonical).startsWith('..') || canonical !== absolute || !lstatSync(absolute).isFile()) throw new Error('source must be a regular file without symlinks');
  if (lstatSync(absolute).size > 256 * 1024) return null;
  const text = readFileSync(absolute, 'utf8');
  return text.includes('\0') ? null : text;
}
if (!query || query.length > 200) throw new Error('provide a literal query or tracked source path (max 200 characters)');
if (command === 'paths') {
  const matches = files.filter(path => path.toLowerCase().includes(query.toLowerCase()));
  console.log(JSON.stringify({paths: matches.slice(0, 60), total: matches.length, truncated: matches.length > 60}));
} else if (command === 'find') {
  const hits = [];
  let truncated = false;
  outer: for (const path of files) {
    const text = contents(path);
    if (text === null) continue;
    const lines = text.split('\n');
    for (let index = 0; index < lines.length; index++) {
      if (!lines[index].toLowerCase().includes(query.toLowerCase())) continue;
      if (hits.length === 30) { truncated = true; break outer; }
      hits.push({path, line: index + 1, text: lines[index].slice(0, 240)});
    }
  }
  console.log(JSON.stringify({hits, truncated}));
} else if (command === 'read') {
  const text = contents(query);
  if (text === null) throw new Error('source exceeds 256 KiB or is binary; use a narrower first-party contract');
  const offset = Number(start);
  if (!Number.isSafeInteger(offset) || offset < 1) throw new Error('line must be a positive integer');
  const lines = text.split('\n');
  const selected = [];
  const clippedLines = [];
  let bytes = 0;
  for (let index = offset - 1; index < Math.min(lines.length, offset + 79); index++) {
    const line = `${index + 1}: ${lines[index].slice(0, 500)}`;
    if (bytes + Buffer.byteLength(line) > 10000) break;
    selected.push(line); bytes += Buffer.byteLength(line);
    if (lines[index].length > 500) clippedLines.push(index + 1);
  }
  console.log(JSON.stringify({path: query, lines: selected, clipped_lines: clippedLines, next_line: offset + selected.length <= lines.length ? offset + selected.length : null, total_lines: lines.length}));
} else throw new Error('use paths, find or read');
