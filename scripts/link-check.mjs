import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = 'dist';

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'pagefind') continue;
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith('.html')) yield path;
  }
}

function routeOf(file) {
  return '/' + relative(dist, file).replace(/index\.html$/, '');
}

function fileFor(pathname) {
  const clean = decodeURIComponent(pathname);
  return clean.endsWith('/') ? join(dist, clean, 'index.html') : join(dist, clean);
}

const pages = new Map();
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const links = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  pages.set(routeOf(file), { ids, links });
}

const broken = [];
for (const [route, { links }] of pages) {
  for (const link of links) {
    if (/^[a-z]+:/i.test(link) || link.startsWith('//')) continue;
    const url = new URL(link, `https://site.invalid${route}`);
    const target = url.pathname === route ? route : url.pathname;
    if (!existsSync(fileFor(target))) {
      broken.push(`${route} -> ${link} (no page)`);
      continue;
    }
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (fragment && pages.has(target) && !pages.get(target).ids.has(fragment)) {
      broken.push(`${route} -> ${link} (no #${fragment})`);
    }
  }
}

console.log(`link check: ${pages.size} pages, ${broken.length} broken internal links`);
if (broken.length > 0) {
  for (const line of broken.sort()) console.error(`  ${line}`);
  process.exit(1);
}
