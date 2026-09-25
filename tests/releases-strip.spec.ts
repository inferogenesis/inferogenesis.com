import { expect, test } from '@playwright/test';

test('the landing page shows each project at its latest release, newest first', async ({
  page,
}) => {
  await page.goto('/');
  const items = page.locator('.release-strip li');
  await expect(items).toHaveCount(2);
  const dates = await items
    .locator('time')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime') ?? ''));
  expect(dates).toEqual([...dates].sort().reverse());
  for (const id of ['cpomdp', 'warrantlib']) {
    const item = items.filter({ hasText: id });
    const version = (await item.locator('.version').innerText()).trim();
    const projectPage = await page.context().newPage();
    await projectPage.goto(`/projects/${id}/`);
    const badge = projectPage
      .locator('.project-header .meta div', { hasText: 'Version' })
      .locator('dd');
    await expect(badge).toHaveText(version);
    const firstRelease = projectPage.locator('ul.releases li a').first();
    await expect(item.getByRole('link')).toHaveAttribute(
      'href',
      (await firstRelease.getAttribute('href')) ?? '',
    );
    await projectPage.close();
  }
});
