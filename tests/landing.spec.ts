import { expect, test } from '@playwright/test';

test('landing page carries the organisation name and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Inferogenesis');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inferogenesis');
  await expect(
    page.getByText('continuous active inference, from the first cell'),
  ).toBeVisible();
});

test('landing page uses the site header and has no sidebar or breadcrumbs', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.locator('#site-sidebar')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
});

for (const path of ['/', '/projects/']) {
  test(`${path} lists every project, with the version its page shows, and a link to it`, async ({
    page,
  }) => {
    await page.goto(path);
    const cards = page.locator('.project-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.getByRole('link', { name: 'cpomdp' })).toHaveAttribute(
      'href',
      '/projects/cpomdp/',
    );
    await expect(cards.getByRole('link', { name: 'warrantlib' })).toHaveAttribute(
      'href',
      '/projects/warrantlib/',
    );
    for (const id of ['cpomdp', 'warrantlib']) {
      const cardVersion = (
        await cards.filter({ hasText: id }).locator('.version').innerText()
      ).trim();
      const projectPage = await page.context().newPage();
      await projectPage.goto(`/projects/${id}/`);
      const badge = projectPage
        .locator('.project-header .meta div', { hasText: 'Version' })
        .locator('dd');
      await expect(badge).toHaveText(cardVersion);
      await projectPage.close();
    }
  });
}

test('the projects index sits under a breadcrumb', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
    'Projects',
  );
});

test('landing page offers no menu button, since it has no sidebar to open', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveCount(0);
});
