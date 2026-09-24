import { expect, test } from '@playwright/test';

test.describe('gates table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kitchen-sink/');
  });

  test('states its as-of date on the table itself', async ({ page }) => {
    await expect(page.locator('table.gates caption')).toContainText('As of 2026-09-23');
  });

  for (const [outcome, label] of [
    ['PASS', 'PASS'],
    ['FAIL', 'FAIL'],
    ['VOID', 'VOID'],
    ['pending', 'Pending'],
  ]) {
    test(`a ${outcome} row shows its glyph and its word, never colour alone`, async ({
      page,
    }) => {
      const cell = page
        .locator(`table.gates td.outcome[data-outcome="${outcome}"]`)
        .first();
      await expect(cell.getByRole('img', { name: label })).toBeVisible();
      await expect(cell).toContainText(label);
    });
  }

  test('a VOID row says why it went unmeasured', async ({ page }) => {
    await expect(page.locator('td.outcome[data-outcome="VOID"]')).toContainText(
      '(budget)',
    );
  });

  test('only PASS and FAIL rows carry a warrant', async ({ page }) => {
    for (const outcome of ['VOID', 'pending']) {
      const row = page.locator('table.gates tbody tr', {
        has: page.locator(`td.outcome[data-outcome="${outcome}"]`),
      });
      await expect(row.locator('.warrant')).toHaveText('');
    }
    const passing = page.locator('table.gates tbody tr', {
      has: page.locator('td.outcome[data-outcome="PASS"]'),
    });
    await expect(passing.locator('.warrant')).toHaveText('PROVED');
  });

  test('a computed tier is labelled computed', async ({ page }) => {
    await expect(
      page.locator('table.gates .tier', { hasText: 'computed' }),
    ).toHaveCount(1);
  });

  test('commit refs link to the commit in the named repository', async ({ page }) => {
    await expect(
      page.locator('table.gates').getByRole('link', { name: 'a76cf1b' }).first(),
    ).toHaveAttribute('href', 'https://github.com/inferogenesis/cpomdp/commit/a76cf1b');
  });

  test('a DOI ref links through doi.org', async ({ page }) => {
    await expect(
      page
        .locator('table.gates')
        .getByRole('link', { name: '10.5281/zenodo.21429863' }),
    ).toHaveAttribute('href', 'https://doi.org/10.5281/zenodo.21429863');
  });
});
