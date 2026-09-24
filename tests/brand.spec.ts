import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import sharp, { type Sharp } from 'sharp';

function pngSize(path: string) {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('the favicon is the supplied avatar, byte for byte', async ({ request }) => {
  const served = await (await request.get('/favicon.svg')).text();
  expect(served).toBe(
    readFileSync('src/assets/brand/inferogenesis-avatar.svg', 'utf8'),
  );
});

for (const [file, size] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
] as const) {
  test(`${file} is the avatar rendered at ${size} px`, async () => {
    expect(pngSize(`public/${file}`)).toEqual({ width: size, height: size });
    const pixels = (image: Sharp) => image.ensureAlpha().raw().toBuffer();
    const committed = await pixels(sharp(`public/${file}`));
    const fresh = await pixels(
      sharp('src/assets/brand/inferogenesis-avatar.svg').resize(size, size).png(),
    );
    expect(committed.equals(fresh)).toBe(true);
  });
}

for (const scheme of ['dark', 'light'] as const) {
  test(`the header mark follows the supplied mark in the ${scheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const paint = await page.locator('header .mark').evaluate((svg) => {
      const [ring, dot] = svg.querySelectorAll('circle');
      const stem = svg.querySelector('rect');
      const style = (element: Element | null) => getComputedStyle(element as Element);
      return {
        ring: style(ring).stroke,
        dot: style(dot).fill,
        stem: style(stem).fill,
        geometry: [
          ring.getAttribute('cy'),
          dot.getAttribute('r'),
          stem?.getAttribute('y'),
        ],
      };
    });
    expect(paint.ring).toBe('rgb(230, 159, 0)');
    expect(paint.dot).toBe(paint.stem);
    expect(paint.geometry).toEqual(['26', '4.5', '44']);
  });
}
