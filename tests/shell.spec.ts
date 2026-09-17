import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const pages = ['/kitchen-sink/', '/projects/cpomdp/'];
const schemes = ['dark', 'light'] as const;
const wcag = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
  expect(results.violations).toEqual([]);
}

for (const path of pages) {
  for (const scheme of schemes) {
    test(`${path} has no WCAG 2.2 AA violations in the ${scheme} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expectNoViolations(page);
    });
  }
}

test('the theme toggle switches the theme and remembers it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/kitchen-sink/');
  const toggle = page.getByRole('button', { name: 'Switch to light theme' });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(
    page.getByRole('button', { name: 'Switch to dark theme' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('the sidebar becomes a drawer on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto('/projects/cpomdp/');
  const sidebar = page.locator('#site-sidebar');
  await expect(sidebar).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(sidebar).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

test('the active sidebar item is marked for assistive technology', async ({ page }) => {
  await page.goto('/projects/cpomdp/');
  await expect(page.locator('#site-sidebar a[aria-current="page"]')).toHaveText(
    'cpomdp',
  );
});
