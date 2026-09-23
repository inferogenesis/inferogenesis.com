import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = 'dist';
const budget = JSON.parse(readFileSync('bundle-budget.json', 'utf8'));

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'pagefind') continue;
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name === 'index.html') yield path;
  }
}

function gzipped(text) {
  return gzipSync(Buffer.from(text)).length;
}

function assetSize(src) {
  return gzipped(readFileSync(join(dist, src)));
}

function measure(file) {
  const html = readFileSync(file, 'utf8');
  const route = '/' + relative(dist, file).replace(/index\.html$/, '');
  let js = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = /\bsrc="([^"]+)"/.exec(match[1]);
    js += src ? assetSize(src[1]) : gzipped(match[2]);
  }
  let css = 0;
  for (const match of html.matchAll(
    /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g,
  )) {
    css += assetSize(match[1]);
  }
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    css += gzipped(match[1]);
  }
  return { route, js, css };
}

const rows = [...htmlFiles(dist)]
  .map(measure)
  .filter((row) => !budget.ignore.includes(row.route));
let failed = false;
console.log(
  'route'.padEnd(28),
  'js'.padStart(7),
  'budget'.padStart(7),
  'css'.padStart(7),
  'budget'.padStart(7),
);
for (const row of rows) {
  const jsBudget = budget.js[row.route] ?? budget.js.default;
  const cssBudget = budget.css[row.route] ?? budget.css.default;
  const over = row.js > jsBudget || row.css > cssBudget;
  failed ||= over;
  console.log(
    row.route.padEnd(28),
    String(row.js).padStart(7),
    String(jsBudget).padStart(7),
    String(row.css).padStart(7),
    String(cssBudget).padStart(7),
    over ? 'OVER' : '',
  );
}
if (failed) {
  console.error('bundle check: a page is over budget. See bundle-budget.json.');
  process.exit(1);
}
