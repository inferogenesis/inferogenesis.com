import { Resvg } from '@resvg/resvg-js';
import type { AstroIntegration } from 'astro';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureWith, ogImagePath, ogSvg } from '../lib/og';

const fonts = [
  'src/assets/og/SpaceGrotesk-Medium.ttf',
  'src/assets/og/SpaceGrotesk-Bold.ttf',
];

function* pages(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'pagefind' || name === 'og') continue;
    if (statSync(path).isDirectory()) yield* pages(path);
    else if (name === 'index.html') yield path;
  }
}

const decode = (text: string) =>
  text
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');

// Renders one PNG per built page from the banner, named by the path its og:image gives.
export default function shareImages(): AstroIntegration {
  return {
    name: 'share-images',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const banner = readFileSync(
          'src/assets/brand/inferogenesis-banner-1.svg',
          'utf8',
        );
        const measure = measureWith(fonts[0]);
        let count = 0;
        for (const file of pages(dist)) {
          const html = readFileSync(file, 'utf8');
          const title = /<meta property="og:title" content="([^"]*)"/.exec(html)?.[1];
          if (title === undefined) throw new Error(`${file} has no og:title.`);
          const route = '/' + relative(dist, dirname(file)).split('\\').join('/');
          const pathname = route === '/' ? '/' : `${route}/`;
          const svg = ogSvg(banner, pathname === '/' ? null : decode(title), measure);
          const png = new Resvg(svg, {
            font: {
              fontFiles: fonts,
              loadSystemFonts: false,
              defaultFontFamily: 'Space Grotesk',
            },
          })
            .render()
            .asPng();
          const target = join(dist, ogImagePath(pathname));
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, png);
          count++;
        }
        logger.info(`${count} share images rendered`);
      },
    },
  };
}
