import { expect, test } from '@playwright/test';

type ShiftWindow = Window & { layoutShift: number };

test('text barely moves when slow web fonts swap in', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 823 });
  await page.route('**/fonts/*.woff2', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.addInitScript(() => {
    const target = window as unknown as ShiftWindow;
    target.layoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number }[]) {
        target.layoutShift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('/projects/cpomdp/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const shift = await page.evaluate(
    () => (window as unknown as ShiftWindow).layoutShift,
  );
  // Without the metric-matched fallback faces this page shifts by about 0.15.
  expect(shift).toBeLessThan(0.05);
});
