import { expect, test, type Page } from '@playwright/test';

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

async function versionBadge(page: Page) {
  return (
    await page
      .locator('.project-header .meta div', { hasText: 'Version' })
      .locator('dd')
      .innerText()
  ).trim();
}

for (const id of ['cpomdp', 'warrantlib']) {
  test(`${id}'s version badge, first release and BibTeX agree`, async ({ page }) => {
    await page.goto(`/projects/${id}/`);
    const version = await versionBadge(page);
    const firstRelease = (
      await page.locator('ul.releases li a').first().innerText()
    ).trim();
    expect(firstRelease.replace(/^v/, '')).toBe(version);
    await expect(page.locator('pre.bibtex')).toContainText(`version = {${version}}`);
  });
}

test("cpomdp links its CITATION.cff at the latest release's tag", async ({ page }) => {
  await page.goto('/projects/cpomdp/');
  const tag = (await page.locator('ul.releases li a').first().innerText()).trim();
  await expect(
    page.getByRole('link', { name: `CITATION.cff at ${tag}` }),
  ).toHaveAttribute(
    'href',
    `https://github.com/inferogenesis/cpomdp/blob/${tag}/CITATION.cff`,
  );
});

test('the warrantlib snippet is the example published with 0.3.0', async ({ page }) => {
  await page.goto('/projects/warrantlib/');
  const snippet = page.locator('figure.snippet');
  await expect(snippet).toContainText('print(check_summary([report]))');
  await expect(snippet.locator('figcaption')).toContainText('commit 1d437ef');
});
