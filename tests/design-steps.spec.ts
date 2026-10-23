import { expect, test } from '@playwright/test';

test.describe('design steps table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kitchen-sink/');
  });

  test('states the release and the date it was checked on the table itself', async ({
    page,
  }) => {
    await expect(page.locator('table.steps caption')).toContainText(
      'Checked against cpomdp v0.4.4 on 2026-10-01.',
    );
  });

  test('says when the project has released since', async ({ page }) => {
    await expect(page.locator('table.steps caption')).toContainText(
      'cpomdp has since released v',
    );
  });

  for (const [status, label] of [
    ['now', 'In cpomdp now'],
    ['simplified', 'Simplified version'],
    ['open', 'Open'],
  ]) {
    test(`a ${status} row shows its glyph and its words, never colour alone`, async ({
      page,
    }) => {
      const cell = page.locator(`table.steps td[data-status="${status}"]`).first();
      await expect(cell.getByRole('img', { name: label })).toBeVisible();
      // The no-break space in "In cpomdp now" reads as a plain space.
      await expect(cell).toHaveText(label);
    });
  }

  test('a name from the code renders as code', async ({ page }) => {
    await expect(page.locator('table.steps td code')).toHaveText('Agent');
  });
});
