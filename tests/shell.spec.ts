import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { primaryNav } from '../src/lib/nav';

const pages = [
  '/',
  '/projects/',
  '/kitchen-sink/',
  '/projects/cpomdp/',
  '/projects/warrantlib/',
  '/about/',
  '/support/',
  '/research/',
  '/research/state-dependent-observation-noise/',
  '/programmes/',
  '/programmes/p-star/',
  '/writing/',
];
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

test('the theme toggle is the first header tool on a wide viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const header = page.locator('.site-header');
  const toggle = header.getByRole('button', { name: /Switch to (light|dark) theme/ });
  const search = header.getByRole('button', { name: 'Search' });
  const [toggleBox, searchBox] = [
    await toggle.boundingBox(),
    await search.boundingBox(),
  ];
  expect(toggleBox!.x).toBeLessThan(searchBox!.x);
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(search).toBeFocused();
});

test('on a phone, Search and Menu share the first row with the mark', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const header = page.locator('.site-header');
  const home = await header.getByRole('link', { name: 'Inferogenesis' }).boundingBox();
  const search = await header.getByRole('button', { name: 'Search' }).boundingBox();
  const menu = await header.getByRole('button', { name: 'Menu' }).boundingBox();
  const middle = (box: typeof home) => box!.y + box!.height / 2;
  expect(Math.abs(middle(search) - middle(home))).toBeLessThan(4);
  expect(Math.abs(middle(menu) - middle(home))).toBeLessThan(4);
  expect(search!.x).toBeLessThan(menu!.x);
  await expect(
    header.getByRole('button', { name: /Switch to (light|dark) theme/ }),
  ).toBeHidden();
});

test('opening the menu leaves Search where it was', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/cpomdp/');
  const search = page.locator('.site-header').getByRole('button', { name: 'Search' });
  const before = await search.boundingBox();
  await page.getByRole('button', { name: 'Menu' }).click();
  expect(await search.boundingBox()).toEqual(before);
});

test('the phone menu carries the theme toggle after the links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  const menu = page.locator('#site-menu');
  const lastLink = await menu.getByRole('link').last().boundingBox();
  const toggle = menu.getByRole('button', { name: 'Switch to light theme' });
  await expect(toggle).toBeVisible();
  expect((await toggle.boundingBox())!.y).toBeGreaterThan(lastLink!.y);
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(
    menu.getByRole('button', { name: 'Switch to dark theme' }),
  ).toBeVisible();
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

const phone = { width: 390, height: 844 };

for (const path of ['/', '/projects/cpomdp/']) {
  test(`${path} reaches every section from the menu on a phone`, async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto(path);
    const primary = page.getByRole('navigation', { name: 'Primary' });
    await expect(primary).toBeHidden();
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    for (const item of primaryNav) {
      await expect(primary.getByRole('link', { name: item.label })).toBeVisible();
    }
    await primary.getByRole('link', { name: 'Programmes' }).click();
    await expect(page).toHaveURL(/\/programmes\/$/);
  });
}

test('keyboard focus moves from the menu button into the links it reveals', async ({
  page,
}) => {
  await page.setViewportSize(phone);
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('navigation', { name: 'Primary' }).getByRole('link').first(),
  ).toBeFocused();
});

test('Escape closes the menu and returns focus to its button', async ({ page }) => {
  await page.setViewportSize(phone);
  await page.goto('/projects/cpomdp/');
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
  await expect(page.locator('#site-sidebar')).toBeHidden();
  await expect(menu).toBeFocused();
});

test('the open menu has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.setViewportSize(phone);
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expectNoViolations(page);
});

test('a wide viewport shows the primary navigation and no menu button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
});

test('the active sidebar item is marked for assistive technology', async ({ page }) => {
  await page.goto('/projects/cpomdp/');
  await expect(page.locator('#site-sidebar a[aria-current="page"]')).toHaveText(
    'cpomdp',
  );
});
