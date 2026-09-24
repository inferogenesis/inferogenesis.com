import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import {
  fetchResearchRecord,
  readResearchRecord,
  resolveResearchRecord,
} from '../src/lib/datacite';

const recorded = JSON.parse(
  readFileSync('tests/fixtures/datacite-arxiv-2607.20306.json', 'utf8'),
);
const doi = '10.48550/arXiv.2607.20306';
const today = () => '2026-09-24';

function fakeFetch(body: unknown, status = 200) {
  const requests: string[] = [];
  const fetch = async (input: string) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), { status });
  };
  return { fetch, requests };
}

function withAttributes(change: Record<string, unknown>) {
  return { data: { attributes: { ...recorded.data.attributes, ...change } } };
}

const entryIds = readdirSync('src/content/research')
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''));

test.describe('research records from DataCite', () => {
  for (const id of entryIds) {
    test(`${id} has a committed DataCite snapshot that validates`, () => {
      expect(() => readResearchRecord(id)).not.toThrow();
    });
  }

  test('the recorded response reproduces the committed snapshot', async () => {
    const { fetch } = fakeFetch(recorded);
    const live = await fetchResearchRecord(doi, { fetch, today });
    const snapshot = readResearchRecord('state-dependent-observation-noise');
    expect({ ...live, retrieved: '' }).toEqual({ ...snapshot, retrieved: '' });
  });

  test('asks DataCite for the DOI', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    await fetchResearchRecord(doi, { fetch, today });
    expect(requests).toEqual([
      'https://api.datacite.org/dois/10.48550/arXiv.2607.20306',
    ]);
  });

  test('names people given name first, as they are cited on the page', async () => {
    const { fetch } = fakeFetch(recorded);
    expect((await fetchResearchRecord(doi, { fetch, today })).authors).toEqual([
      'Daniel Corva',
    ]);
  });

  test('keeps an organisation author as DataCite names it', async () => {
    const creators = [{ name: 'Inferogenesis', nameType: 'Organizational' }];
    const { fetch } = fakeFetch(withAttributes({ creators }));
    expect((await fetchResearchRecord(doi, { fetch, today })).authors).toEqual([
      'Inferogenesis',
    ]);
  });

  test('takes the short licence name from the SPDX identifier', async () => {
    const { fetch } = fakeFetch(recorded);
    const { licence } = await fetchResearchRecord(doi, { fetch, today });
    expect(licence).toEqual({
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/legalcode',
    });
  });

  test('refuses a resource type the list has no kind for', async () => {
    const { fetch } = fakeFetch(
      withAttributes({ types: { resourceTypeGeneral: 'Workflow' } }),
    );
    await expect(fetchResearchRecord(doi, { fetch, today })).rejects.toThrow(
      'Workflow',
    );
  });

  test('refuses a record with no abstract, since the list quotes one', async () => {
    const { fetch } = fakeFetch(withAttributes({ descriptions: [] }));
    await expect(fetchResearchRecord(doi, { fetch, today })).rejects.toThrow();
  });

  test('fails on an HTTP error and names the status', async () => {
    const { fetch } = fakeFetch({ errors: [{ status: '404' }] }, 404);
    await expect(fetchResearchRecord(doi, { fetch, today })).rejects.toThrow(
      'HTTP 404',
    );
  });

  test('a local build reads the snapshot', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    const record = await resolveResearchRecord(
      'state-dependent-observation-noise',
      doi,
      {
        env: {},
        fetch,
        today,
      },
    );
    expect(requests).toHaveLength(0);
    expect(record.title).toContain('State-Dependent Observation Noise');
  });

  test('a local build fails when the snapshot is for another DOI', async () => {
    const { fetch } = fakeFetch(recorded);
    await expect(
      resolveResearchRecord('state-dependent-observation-noise', '10.5281/zenodo.1', {
        env: {},
        fetch,
        today,
      }),
    ).rejects.toThrow('10.5281/zenodo.1');
  });

  test('a live build asks DataCite', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    await resolveResearchRecord('state-dependent-observation-noise', doi, {
      env: { CI: 'true' },
      fetch,
      today,
    });
    expect(requests).toHaveLength(1);
  });
});
