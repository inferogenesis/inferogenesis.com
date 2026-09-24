import { expect, test } from '@playwright/test';

test('research sits in the primary navigation', async ({ page }) => {
  await page.goto('/research/');
  const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', {
    name: 'Research',
  });
  await expect(link).toHaveAttribute('href', '/research/');
  await expect(link).toHaveAttribute('aria-current', 'true');
});

test('entries are listed newest first', async ({ page }) => {
  await page.goto('/research/');
  const dates = await page
    .locator('.research-entry time')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime') ?? ''));
  expect(dates.length).toBeGreaterThan(0);
  expect(dates).toEqual([...dates].sort().reverse());
});

test('the arXiv preprint links its DOI, its arXiv page and its artefact', async ({
  page,
}) => {
  await page.goto('/research/');
  const entry = page.locator('.research-entry', {
    hasText: 'State-Dependent Observation Noise',
  });
  await expect(entry).toContainText('Daniel Corva');
  await expect(
    entry.getByRole('link', { name: '10.48550/arXiv.2607.20306' }),
  ).toHaveAttribute('href', 'https://doi.org/10.48550/arXiv.2607.20306');
  await expect(entry.getByRole('link', { name: 'arXiv:2607.20306' })).toHaveAttribute(
    'href',
    'https://arxiv.org/abs/2607.20306',
  );
  await expect(entry.getByRole('link', { name: /cpomdp v0\.4\.2/ })).toHaveAttribute(
    'href',
    'https://doi.org/10.5281/zenodo.21429863',
  );
});

test('a quoted abstract says whose it is and under what terms', async ({ page }) => {
  await page.goto('/research/');
  const entry = page.locator('.research-entry').first();
  const attribution = entry.locator('.abstract-attribution');
  await expect(attribution).toContainText('Daniel Corva');
  await expect(attribution.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
    'href',
    /creativecommons\.org\/licenses\/by\/4\.0/,
  );
});

const entryPath = '/research/state-dependent-observation-noise/';

test('each list entry links its title to the entry page', async ({ page }) => {
  await page.goto('/research/');
  await expect(
    page
      .locator('.research-entry')
      .first()
      .getByRole('heading', { level: 2 })
      .getByRole('link'),
  ).toHaveAttribute('href', entryPath);
});

test('an entry page has the title as its heading, under a Research breadcrumb', async ({
  page,
}) => {
  await page.goto(entryPath);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'State-Dependent Observation Noise',
  );
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'Research' })).toHaveAttribute(
    'href',
    '/research/',
  );
});

test("an entry page's structured data matches what the page shows", async ({
  page,
}) => {
  await page.goto(entryPath);
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(data['@type']).toBe('ScholarlyArticle');
  expect(data.name).toBe(
    (await page.getByRole('heading', { level: 1 }).innerText()).trim(),
  );
  expect(data.datePublished).toBe(
    await page.locator('.research-entry time').getAttribute('datetime'),
  );
  expect(data.author.map((author: { name: string }) => author.name)).toEqual([
    'Daniel Corva',
  ]);
  expect(data.license).toBe(
    await page.locator('.abstract-attribution a').getAttribute('href'),
  );
  expect(data.url).toBe(`https://inferogenesis.com${entryPath}`);
});
