import { expect, test } from '@playwright/test';
import { measurePage } from '../scripts/bundle-check.mjs';
import {
  organisation,
  scholarlyWork,
  softwareSourceCode,
} from '../src/lib/structuredData';

const record = {
  doi: '10.48550/arXiv.2607.20306',
  title: 'A title',
  kind: 'preprint' as const,
  authors: ['Daniel Corva'],
  published: '2026-07-22',
  publisher: 'arXiv',
  abstract: 'An abstract.',
  licence: {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/legalcode',
  },
  retrieved: '2026-09-24',
};
const artefacts = [
  { label: 'cpomdp v0.4.2', url: 'https://doi.org/10.5281/zenodo.21429863' },
];
const pageUrl = 'https://inferogenesis.com/research/a/';

test.describe('scholarly structured data', () => {
  test('describes a preprint as a ScholarlyArticle with its DOI', () => {
    const data = scholarlyWork(record, artefacts, pageUrl);
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      name: 'A title',
      headline: 'A title',
      author: [{ '@type': 'Person', name: 'Daniel Corva' }],
      datePublished: '2026-07-22',
      abstract: 'An abstract.',
      license: 'https://creativecommons.org/licenses/by/4.0/legalcode',
      url: pageUrl,
      identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: record.doi },
      sameAs: [
        'https://doi.org/10.48550/arXiv.2607.20306',
        'https://arxiv.org/abs/2607.20306',
      ],
      isBasedOn: [
        { '@type': 'CreativeWork', name: 'cpomdp v0.4.2', url: artefacts[0].url },
      ],
    });
  });

  test('describes a dataset as a Dataset', () => {
    const data = scholarlyWork(
      { ...record, kind: 'dataset', doi: '10.5281/zenodo.1' },
      [],
      pageUrl,
    );
    expect(data['@type']).toBe('Dataset');
    expect(data.sameAs).toEqual(['https://doi.org/10.5281/zenodo.1']);
    expect(data).not.toHaveProperty('isBasedOn');
  });

  test('credits an organisation as an Organization', () => {
    const data = scholarlyWork({ ...record, authors: ['Inferogenesis'] }, [], pageUrl, [
      'Inferogenesis',
    ]);
    expect(data.author).toEqual([{ '@type': 'Organization', name: 'Inferogenesis' }]);
  });
});

test.describe('bundle check', () => {
  test('does not count structured data as script', () => {
    const html =
      '<script type="application/ld+json">{"@type":"Thing","name":"' +
      'x'.repeat(5000) +
      '"}</script><script>let a = 1;</script>';
    const { js } = measurePage(html, () => 0);
    expect(js).toBeLessThan(100);
  });
});

test.describe('organisation and software structured data', () => {
  test('names the organisation, its home, its logo and its GitHub', () => {
    expect(organisation('https://inferogenesis.com')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Inferogenesis',
      url: 'https://inferogenesis.com/',
      logo: 'https://inferogenesis.com/icon-512.png',
      sameAs: ['https://github.com/inferogenesis'],
    });
  });

  const project = {
    name: 'cpomdp',
    description: 'Continuous active inference for Python.',
    licence: 'MIT',
    repo: 'https://github.com/inferogenesis/cpomdp',
    docs: 'https://cpomdp.inferogenesis.com/',
    doi: '10.5281/zenodo.21334562',
    authors: ['Inferogenesis'],
    pypi: 'cpomdp',
  };
  const release = { version: '0.4.4', published: '2026-08-04' };
  const url = 'https://inferogenesis.com/projects/cpomdp/';

  test('describes a project as SoftwareSourceCode at its latest release', () => {
    expect(softwareSourceCode(project, release, '>=3.10', url)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: 'cpomdp',
      description: 'Continuous active inference for Python.',
      url,
      codeRepository: 'https://github.com/inferogenesis/cpomdp',
      programmingLanguage: 'Python',
      runtimePlatform: 'Python >=3.10',
      softwareVersion: '0.4.4',
      datePublished: '2026-08-04',
      license: 'https://spdx.org/licenses/MIT.html',
      author: [{ '@type': 'Organization', name: 'Inferogenesis' }],
      identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: project.doi },
      sameAs: [
        'https://doi.org/10.5281/zenodo.21334562',
        'https://cpomdp.inferogenesis.com/',
      ],
    });
  });

  test('omits the DOI and the runtime when a project has neither', () => {
    const data = softwareSourceCode(
      { ...project, doi: undefined, pypi: undefined },
      release,
      null,
      url,
    );
    expect(data).not.toHaveProperty('identifier');
    expect(data).not.toHaveProperty('runtimePlatform');
    expect(data).not.toHaveProperty('programmingLanguage');
    expect(data.sameAs).toEqual(['https://cpomdp.inferogenesis.com/']);
  });
});

async function structuredData(page: import('@playwright/test').Page) {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));
  return blocks.map((block) => JSON.parse(block));
}

test.describe('structured data on built pages', () => {
  for (const path of [
    '/',
    '/projects/',
    '/programmes/p-star/',
    '/research/',
    '/about/',
  ]) {
    test(`${path} carries the organisation once`, async ({ page }) => {
      await page.goto(path);
      const organisations = (await structuredData(page)).filter(
        (data) => data['@type'] === 'Organization',
      );
      expect(organisations).toHaveLength(1);
      expect(organisations[0].url).toBe('https://inferogenesis.com/');
    });
  }

  for (const id of ['cpomdp', 'warrantlib']) {
    test(`${id}'s software data matches the version and name its page shows`, async ({
      page,
    }) => {
      await page.goto(`/projects/${id}/`);
      const [software] = (await structuredData(page)).filter(
        (data) => data['@type'] === 'SoftwareSourceCode',
      );
      const badge = page
        .locator('.project-header .meta div', { hasText: 'Version' })
        .locator('dd');
      expect(software.softwareVersion).toBe((await badge.innerText()).trim());
      expect(software.name).toBe(
        (await page.getByRole('heading', { level: 1 }).innerText()).trim(),
      );
      expect(software.url).toBe(`https://inferogenesis.com/projects/${id}/`);
    });
  }
});
