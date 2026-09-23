import { expect, test } from '@playwright/test';

for (const [path, title] of [
  ['/about/', 'About'],
  ['/support/', 'Support'],
]) {
  test(`${path} sits under a breadcrumb and in the footer`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
      title,
    );
    await expect(
      page.locator('.site-footer').getByRole('link', { name: title }),
    ).toHaveAttribute('href', path);
  });
}

test('support links the maintainer’s GitHub Sponsors page', async ({ page }) => {
  await page.goto('/support/');
  await expect(page.getByRole('link', { name: /GitHub Sponsors/ })).toHaveAttribute(
    'href',
    'https://github.com/sponsors/DanBoringName',
  );
});

test('about carries the AI-use statement under its own heading', async ({ page }) => {
  await page.goto('/about/');
  const heading = page.getByRole('heading', { level: 2, name: 'How AI is used' });
  await expect(heading).toBeVisible();
  await expect(page.locator('main')).toContainText('without supervision');
});
