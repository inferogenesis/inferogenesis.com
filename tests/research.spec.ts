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
