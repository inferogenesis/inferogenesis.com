import { expect, test } from '@playwright/test';
import { measurePage } from '../scripts/bundle-check.mjs';
import { scholarlyWork } from '../src/lib/structuredData';

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
