import { expect, test } from '@playwright/test';

const pStar = '/programmes/p-star/';

test('programmes sit in the primary navigation', async ({ page }) => {
  await page.goto(pStar);
  const link = page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Programmes' });
  await expect(link).toHaveAttribute('href', '/programmes/');
  await expect(link).toHaveAttribute('aria-current', 'true');
});

test('the programmes index links each programme', async ({ page }) => {
  await page.goto('/programmes/');
  await expect(
    page.locator('main').getByRole('link', { name: /certifiable active inference/i }),
  ).toHaveAttribute('href', pStar);
});

test('a programme page leads with its question and scope', async ({ page }) => {
  await page.goto(pStar);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'certifiable active inference',
  );
  await expect(page.locator('.programme-question')).not.toBeEmpty();
  await expect(page.locator('.programme-scope')).toContainText(
    'exogenous action sequence',
  );
});

test('the gates table carries the ledger date', async ({ page }) => {
  await page.goto(pStar);
  await expect(page.locator('table.gates caption')).toContainText('As of 2026-09-12');
});

test('cells verified at release sit apart from the pre-registered gates', async ({
  page,
}) => {
  await page.goto(pStar);
  const verified = page.locator('table.verified');
  await expect(verified.locator('caption')).toContainText('not pre-registered');
  for (const [cell, release] of [
    ['A1', 'v0.4.2'],
    ['B3', 'v0.4.3'],
    ['B4', 'v0.4.3'],
  ]) {
    const row = verified.locator('tbody tr', {
      has: page.locator('th', { hasText: new RegExp(`^${cell} ·`) }),
    });
    await expect(row).toContainText(release);
  }
  await expect(page.locator('table.gates th', { hasText: /^A1 ·/ })).toHaveCount(0);
});

test('the programme links its paper', async ({ page }) => {
  await page.goto(pStar);
  await expect(
    page.locator('.programme-papers').getByRole('link').first(),
  ).toHaveAttribute('href', '/research/state-dependent-observation-noise/');
});

test('planned work sits inside the roadmap callout', async ({ page }) => {
  await page.goto(pStar);
  const roadmap = page.locator('.callout.roadmap');
  for (const item of ['E2', 'F2', 'F3', 'Paper 2']) {
    await expect(roadmap).toContainText(item);
  }
});

test('H* = 7 never appears without its upper bound and its action mode', async ({
  page,
}) => {
  await page.goto(pStar);
  const quoting = page.locator('main p, main li, main td', { hasText: 'H* = 7' });
  const count = await quoting.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index++) {
    await expect(quoting.nth(index)).toContainText('upper bound');
    await expect(quoting.nth(index)).toContainText('open-loop');
  }
  await expect(page.locator('table.gates')).not.toContainText('H* = 7');
});

test('at desktop width the gates table fits and each claim has room to read', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(pStar);
  const region = page.locator('.gates-scroll');
  const fits = await region.evaluate(
    (element) => element.scrollWidth <= element.clientWidth,
  );
  expect(fits).toBe(true);
  const claimWidth = await page
    .locator('table.gates td.claim')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(claimWidth).toBeGreaterThanOrEqual(256);
});

test('the decomposition under test is displayed right after the scope', async ({
  page,
}) => {
  await page.goto(pStar);
  const equation = page.locator('.programme-scope + .programme-equation');
  await expect(equation).toHaveAttribute('role', 'region');
  await expect(equation).toHaveAttribute('aria-label', /decomposition/i);
  await expect(equation).toHaveAttribute('tabindex', '0');
  const math = equation.locator('math[display="block"]');
  await expect(math).toHaveCount(1);
  for (const term of ['floor', 'misspecification', 'inference gap']) {
    await expect(math).toContainText(term);
  }
});

test('the equation is typeset once for sight and once for assistive technology', async ({
  page,
}) => {
  await page.goto(pStar);
  const equation = page.locator('.programme-equation');
  const typeset = equation.locator('.equation-typeset');
  await expect(typeset).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.equation-typeset > svg')).toBeVisible();
  const spoken = equation.locator('.visually-hidden math');
  await expect(spoken).toHaveCount(1);
  const hidden = await spoken.evaluate((element) => {
    const box = element.closest('.visually-hidden')!.getBoundingClientRect();
    return box.width <= 1 && box.height <= 1;
  });
  expect(hidden).toBe(true);
});

test('the page says its checks report through warrantlib', async ({ page }) => {
  await page.goto(pStar);
  const method = page.locator('.programme-method');
  await expect(method.getByRole('link', { name: 'warrantlib' })).toHaveAttribute(
    'href',
    '/projects/warrantlib/',
  );
  await expect(method).toContainText('PROVED');
});

test('at desktop width the whole equation shows without scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(pStar);
  const fits = await page
    .locator('.programme-equation')
    .evaluate((element) => element.scrollWidth <= element.clientWidth);
  expect(fits).toBe(true);
});
