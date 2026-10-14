import { expect, test } from '@playwright/test';

const writeUpPath = '/projects/cpomdp/applied/anti-surge/';
const script =
  'https://github.com/inferogenesis/cpomdp/blob/main/examples/surge_margin.py';
const docs = 'https://cpomdp.inferogenesis.com/guides/surge_margin/';

test('a project lists its write-ups after what it does and before its capabilities', async ({
  page,
}) => {
  await page.goto('/projects/cpomdp/');
  const sections = await page
    .locator('main h2[id]')
    .evaluateAll((headings) => headings.map((heading) => heading.id));
  expect(sections.indexOf('applied')).toBeGreaterThan(sections.indexOf('example'));
  expect(sections.indexOf('applied')).toBeLessThan(sections.indexOf('capabilities'));
  await expect(
    page.locator('ul.applied').getByRole('link', { name: 'Anti-surge control' }),
  ).toHaveAttribute('href', writeUpPath);
});

test('a project with no write-ups has no Applied section', async ({ page }) => {
  await page.goto('/projects/warrantlib/');
  await expect(page.locator('#applied')).toHaveCount(0);
});

test('a write-up labels its numbers computed and links the script', async ({
  page,
}) => {
  await page.goto(writeUpPath);
  const label = page.locator('.callout', { hasText: 'computed by' });
  await expect(
    label.getByRole('link', { name: 'examples/surge_margin.py' }),
  ).toHaveAttribute('href', script);
  await expect(label.getByRole('link', { name: 'the cpomdp docs' })).toHaveAttribute(
    'href',
    docs,
  );
});

test('a write-up crumbs back to its project', async ({ page }) => {
  await page.goto(writeUpPath);
  await expect(
    page.locator('nav.breadcrumbs').getByRole('link', { name: 'cpomdp' }),
  ).toHaveAttribute('href', '/projects/cpomdp/');
});

test("a write-up's structured data matches what the page shows", async ({ page }) => {
  await page.goto(writeUpPath);
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')));
  const data = blocks.find((block) => block['@type'] === 'TechArticle');
  expect(data.headline).toBe(
    (await page.getByRole('heading', { level: 1 }).innerText()).trim(),
  );
  expect(data.datePublished).toBe(
    await page.locator('.applied-header time.published').getAttribute('datetime'),
  );
  expect(data.about.name).toBe('cpomdp');
  expect(data.isBasedOn).toEqual([script, docs]);
});

for (const width of [1280, 375]) {
  test(`a write-up's figure fits the column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(writeUpPath);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}
