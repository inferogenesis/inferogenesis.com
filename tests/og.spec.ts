import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { measureWith, ogImagePath, ogSvg, wrapTitle } from '../src/lib/og';

const banner = readFileSync('src/assets/brand/inferogenesis-banner-1.svg', 'utf8');
const measure = measureWith('src/assets/og/SpaceGrotesk-Medium.ttf');

test.describe('share image layout', () => {
  test('maps each route to one image path', () => {
    expect(ogImagePath('/')).toBe('/og/index.png');
    expect(ogImagePath('/projects/cpomdp/')).toBe('/og/projects/cpomdp.png');
    expect(ogImagePath('/programmes/p-star/')).toBe('/og/programmes/p-star.png');
  });

  test('keeps a short title on one line', () => {
    expect(wrapTitle('cpomdp', measure, 40, 880, 3)).toEqual(['cpomdp']);
  });

  test('wraps a long title within the width, at word boundaries', () => {
    const title =
      'State-Dependent Observation Noise Reintroduces Epistemic Value in Linear-Gaussian Active Inference';
    const lines = wrapTitle(title, measure, 40, 880, 3);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) expect(measure(line, 40)).toBeLessThanOrEqual(880);
    expect(lines.join(' ')).toBe(title);
  });

  test('ends a title that will not fit with an ellipsis', () => {
    const lines = wrapTitle('word '.repeat(80).trim(), measure, 40, 880, 3);
    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith('…')).toBe(true);
    expect(measure(lines[2], 40)).toBeLessThanOrEqual(880);
  });

  test('the landing image is the banner itself', () => {
    expect(ogSvg(banner, null, measure)).toBe(banner);
  });

  test('a page image keeps the wordmark and puts the title where the tagline was', () => {
    const svg = ogSvg(banner, 'cpomdp', measure);
    expect(svg).toContain('>infero</tspan>');
    expect(svg).toContain('>genesis</tspan>');
    expect(svg).not.toContain('from the first cell');
    expect(svg).toContain('>cpomdp</tspan>');
  });

  test('escapes markup in a title', () => {
    const svg = ogSvg(banner, 'A & B <c>', measure);
    expect(svg).toContain('A &amp; B &lt;c&gt;');
  });
});

function* builtPages(dir = 'dist'): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'pagefind' || name === 'og') continue;
    if (statSync(path).isDirectory()) yield* builtPages(path);
    else if (name === 'index.html') yield path;
  }
}

const meta = (html: string, key: string) =>
  new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];

function pngSize(path: string) {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test.describe('share images on built pages', () => {
  const pages = [...builtPages()];

  test('every page carries its title, description, image and card type', () => {
    expect(pages.length).toBeGreaterThan(5);
    for (const file of pages) {
      const html = readFileSync(file, 'utf8');
      for (const key of [
        'og:title',
        'og:description',
        'og:image',
        'og:url',
        'og:type',
      ]) {
        expect(meta(html, key), `${file} ${key}`).toBeTruthy();
      }
      expect(meta(html, 'twitter:card')).toBe('summary_large_image');
      const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
      expect(meta(html, 'og:url')).toBe(canonical);
      expect(meta(html, 'og:image')).toMatch(
        /^https:\/\/inferogenesis\.com\/og\/.+\.png$/,
      );
    }
  });

  test('every image exists at 1280 by 640', () => {
    for (const file of pages) {
      const image = new URL(meta(readFileSync(file, 'utf8'), 'og:image') ?? '')
        .pathname;
      const path = join('dist', image);
      expect(existsSync(path), path).toBe(true);
      expect(pngSize(path)).toEqual({ width: 1280, height: 640 });
    }
  });

  test('two pages with different titles get different images', () => {
    const cpomdp = readFileSync('dist/og/projects/cpomdp.png');
    const warrantlib = readFileSync('dist/og/projects/warrantlib.png');
    expect(cpomdp.equals(warrantlib)).toBe(false);
  });
});
