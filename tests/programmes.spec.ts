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

const seam = '/programmes/sn/';

test.describe('the Seam Networks page', () => {
  test('the programmes index lists it', async ({ page }) => {
    await page.goto('/programmes/');
    await expect(
      page.locator('main').getByRole('link', { name: 'Seam Networks' }),
    ).toHaveAttribute('href', seam);
  });

  test('leads with question, scope and the seam figure', async ({ page }) => {
    await page.goto(seam);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seam Networks');
    await expect(page.locator('.programme-question')).not.toBeEmpty();
    const figure = page.locator('.programme-scope + figure.seam-join');
    await expect(figure.getByRole('img').first()).toHaveAttribute(
      'aria-label',
      /Two agents/,
    );
  });

  test('opens by saying it is a string of thought experiments, and where they came from', async ({
    page,
  }) => {
    await page.goto(seam);
    const premise = page.locator('h1 + aside.note');
    await expect(premise).toContainText('thought experiments');
    await expect(page.locator('h1 + aside.note + .programme-question')).toHaveCount(1);
    await expect(premise.getByRole('link', { name: 'p* programme' })).toHaveAttribute(
      'href',
      '/programmes/p-star/',
    );
    await expect(premise.getByRole('link', { name: 'harness' })).toHaveAttribute(
      'href',
      'https://github.com/inferogenesis/cpomdp/blob/3cb17dc/src/cpomdp/harness.py',
    );
  });

  test('asks whether the structure is worth exploring and whether cpomdp can tell', async ({
    page,
  }) => {
    await page.goto(seam);
    await expect(page.locator('.programme-question')).toContainText(
      'make sense to explore',
    );
    await expect(page.locator('.programme-question')).toContainText('cpomdp');
  });

  test('every rung sits inside the roadmap callout and the pattern outside it', async ({
    page,
  }) => {
    await page.goto(seam);
    await expect(page.locator('.ladder-row.pattern')).toHaveCount(1);
    await expect(page.locator('aside.roadmap .ladder-row.pattern')).toHaveCount(0);
    const rungs = page.locator('.ladder-row[data-rung]');
    await expect(rungs).toHaveCount(6);
    await expect(page.locator('aside.roadmap .ladder-row[data-rung]')).toHaveCount(6);
  });

  test('each rung reads agent, world, agent in that order', async ({ page }) => {
    await page.goto(seam);
    for (const row of await page.locator('.ladder-row[data-rung]').all()) {
      const roles = await row.locator('.role').allInnerTexts();
      expect(roles[0].toLowerCase()).toBe('agent');
      expect(roles.at(-1)?.toLowerCase()).toBe('agent');
      expect(roles.slice(1, -1).every((role) => role.toLowerCase() === 'world')).toBe(
        true,
      );
    }
  });

  test('every tag links to its line on the page', async ({ page }) => {
    await page.goto(seam);
    const tags = page.locator('main a.tag[href^="#"]');
    expect(await tags.count()).toBeGreaterThan(8);
    for (const href of await tags.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    )) {
      await expect(page.locator(href)).toHaveCount(1);
    }
  });

  test('rung 0 names the part that exists and links it at its release', async ({
    page,
  }) => {
    await page.goto(seam);
    const exists = page.locator('.ladder-row[data-rung="0"] a.tag.exists');
    await expect(exists).toContainText('v0.4.0');
    await expect(exists).toHaveAttribute(
      'href',
      'https://github.com/inferogenesis/cpomdp/blob/v0.4.0/examples/ffg/chemotaxis_figure.py',
    );
  });

  test('rung 3 shows both worlds at once, the field arm tagged BN-3b', async ({
    page,
  }) => {
    await page.goto(seam);
    const row = page.locator('.ladder-row[data-rung="3"]');
    const worlds = row.locator('.part.world');
    await expect(worlds).toHaveCount(2);
    await expect(worlds.nth(1)).toContainText('BN-3b');
    await expect(row.locator('.row-head a.tag', { hasText: 'BN-3b' })).toHaveAttribute(
      'href',
      '#target-BN-3b',
    );
  });

  test('targets say none has run and open L items say so', async ({ page }) => {
    await page.goto(seam);
    await expect(page.locator('#targets + aside.roadmap')).toContainText(
      'None has run',
    );
    await expect(page.locator('#literature-L1')).toContainText('open');
  });

  test('hovering a term shows its definition, and Escape hides it', async ({
    page,
  }) => {
    await page.goto(seam);
    const term = page
      .locator('.programme-scope .term-wrap', { hasText: 'seam' })
      .first();
    const tip = term.locator('[role="tooltip"]');
    await expect(tip).toBeHidden();
    await term.locator('a.term').hover();
    await expect(tip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
  });

  test('every term on the page carries the definition the glossary gives', async ({
    page,
  }) => {
    await page.goto(seam);
    const terms = page.locator('main .term-wrap');
    expect(await terms.count()).toBeGreaterThan(10);
    for (const wrap of await terms.all()) {
      const href = (await wrap.locator('a.term').getAttribute('href')) ?? '';
      const tip = (await wrap.locator('[role="tooltip"]').textContent())?.trim();
      await expect(page.locator(`${href} dd`)).toHaveText(tip ?? '');
    }
  });

  test('the coordinator is explained where it first appears', async ({ page }) => {
    await page.goto(seam);
    const rung = page.locator('.ladder-row[data-rung="4"] .summary');
    await expect(rung.locator('a.term', { hasText: 'coordinator' })).toHaveCount(1);
    await expect(page.locator('#term-coordinator dd')).toContainText('optional agent');
  });

  test('rung 5 draws its three channels as layers over the same cells', async ({
    page,
  }) => {
    await page.goto(seam);
    const drawing = page.locator('.ladder-row[data-rung="5"] .world-drawing');
    for (const layer of ['synapses', 'spillover', 'endocrine']) {
      await expect(drawing.locator('text', { hasText: layer })).toHaveCount(1);
    }
  });

  test('the page adds one small script, which dismisses term tips', async ({
    page,
  }) => {
    await page.goto(seam);
    await expect(page.locator('main script')).toHaveCount(1);
  });

  test('a phone never scrolls the page sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(seam);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
