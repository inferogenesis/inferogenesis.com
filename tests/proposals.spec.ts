import { expect, test } from '@playwright/test';

const entryPath = '/proposals/uncertainty-aware-anti-surge/';
const discussion = 'https://github.com/inferogenesis/cpomdp/discussions/192';

test('proposals sit in the primary navigation', async ({ page }) => {
  await page.goto('/proposals/');
  const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', {
    name: 'Proposals',
  });
  await expect(link).toHaveAttribute('href', '/proposals/');
  await expect(link).toHaveAttribute('aria-current', 'true');
});

test('the list shows each proposal with its status and its question', async ({
  page,
}) => {
  await page.goto('/proposals/');
  const entry = page.locator('.proposal', { hasText: 'anti-surge controller' });
  await expect(entry.locator('.status')).toHaveText(
    'Open, looking for someone to take it',
  );
  await expect(entry).toContainText('Paper-sized');
  await expect(entry).toContainText('fixed-margin anti-surge controller');
  await expect(
    entry.getByRole('heading', { level: 2 }).getByRole('link'),
  ).toHaveAttribute('href', entryPath);
  await expect(entry.getByRole('link', { name: 'Discussion #192' })).toHaveAttribute(
    'href',
    discussion,
  );
});

test('opened dates run newest first', async ({ page }) => {
  await page.goto('/proposals/');
  const dates = await page
    .locator('.proposal .meta time')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime') ?? ''));
  expect(dates.length).toBeGreaterThan(0);
  expect(dates).toEqual([...dates].sort().reverse());
});

test('an entry page carries the form fields and links its discussion', async ({
  page,
}) => {
  await page.goto(entryPath);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'uncertainty-aware anti-surge controller',
  );
  for (const name of [
    'The question',
    'What a first result looks like',
    'Kind of work',
    'Skills that would help',
    'Respond',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.locator('main code').first()).toHaveText('R(Q)');
  await expect(page.locator('main')).toContainText('Bayesian filtering');
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Discussion #192' }),
  ).toHaveAttribute('href', discussion);
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'Proposals' })).toHaveAttribute(
    'href',
    '/proposals/',
  );
});

test("an entry page's own body links where the question starts", async ({ page }) => {
  await page.goto(entryPath);
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Anti-surge control' }),
  ).toHaveAttribute('href', '/projects/cpomdp/applied/anti-surge/');
});
