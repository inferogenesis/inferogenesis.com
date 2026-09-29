import { expect, test } from '@playwright/test';
import { readBackCatalogue } from '../src/lib/backCatalogue';

const { posts } = readBackCatalogue();

test('writing sits in the primary navigation', async ({ page }) => {
  await page.goto('/writing/');
  const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', {
    name: 'Writing',
  });
  await expect(link).toHaveAttribute('href', '/writing/');
  await expect(link).toHaveAttribute('aria-current', 'true');
});

test('the back catalogue is listed newest first, each post linked where it lives', async ({
  page,
}) => {
  await page.goto('/writing/');
  const entries = page.locator('.post-entry');
  await expect(entries).toHaveCount(posts.length);
  const dates = await entries
    .locator('time.published')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime') ?? ''));
  expect(dates).toEqual([...dates].sort().reverse());
  for (const [index, post] of posts.entries()) {
    const entry = entries.nth(index);
    await expect(entry.getByRole('link', { name: post.title })).toHaveAttribute(
      'href',
      post.url,
    );
    await expect(entry).toContainText(post.summary);
    await expect(entry).toContainText('www.dj-elliott.com');
  }
});

test('every page points feed readers at the writing feed', async ({ page }) => {
  for (const path of ['/', '/writing/']) {
    await page.goto(path);
    await expect(
      page.locator('head link[rel="alternate"][type="application/rss+xml"]'),
    ).toHaveAttribute('href', '/writing/rss.xml');
  }
});

test('the feed carries each post with its canonical link and date', async ({
  request,
}) => {
  const response = await request.get('/writing/rss.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/xml/);
  const xml = await response.text();
  expect(xml).toContain('<link>https://inferogenesis.com/writing/</link>');
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  expect(items).toHaveLength(posts.length);
  for (const [index, post] of posts.entries()) {
    expect(items[index]).toContain(`<link>${post.url}</link>`);
    expect(items[index]).toContain(
      `<pubDate>${new Date(post.published).toUTCString()}</pubDate>`,
    );
  }
});
