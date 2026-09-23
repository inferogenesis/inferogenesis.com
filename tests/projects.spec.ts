import { expect, test } from '@playwright/test';

test('a library without backends shows only the feature and version columns', async ({
  page,
}) => {
  await page.goto('/projects/warrantlib/');
  const headers = page.locator('table.capabilities thead th');
  await expect(headers).toHaveText(['Feature', 'Since']);
});

test('a project without a citation file offers BibTeX and no CFF link', async ({
  page,
}) => {
  await page.goto('/projects/warrantlib/');
  await expect(page.locator('pre.bibtex')).toContainText('@software{warrantlib2026,');
  await expect(page.getByRole('link', { name: /CITATION\.cff/ })).toHaveCount(0);
});

test('cpomdp links its CITATION.cff at the pinned tag', async ({ page }) => {
  await page.goto('/projects/cpomdp/');
  await expect(
    page.getByRole('link', { name: 'CITATION.cff at v0.4.4' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/inferogenesis/cpomdp/blob/v0.4.4/CITATION.cff',
  );
});

test('the warrantlib snippet is the example published with 0.3.0', async ({ page }) => {
  await page.goto('/projects/warrantlib/');
  const snippet = page.locator('figure.snippet');
  await expect(snippet).toContainText('print(check_summary([report]))');
  await expect(snippet.locator('figcaption')).toContainText('commit 1d437ef');
});
