import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  fetchBackCatalogue,
  readBackCatalogue,
  resolveBackCatalogue,
} from '../src/lib/backCatalogue';

const recorded = JSON.parse(
  readFileSync('tests/fixtures/back-catalogue-posts.json', 'utf8'),
) as Record<string, unknown>[];
const feed = 'https://www.dj-elliott.com/blog/posts.json';
const today = () => '2026-09-25';

function fakeFetch(body: unknown, status = 200) {
  const requests: string[] = [];
  const fetch = async (input: string) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), { status });
  };
  return { fetch, requests };
}

test.describe('the back catalogue on the personal site', () => {
  test('the committed snapshot validates', () => {
    expect(() => readBackCatalogue()).not.toThrow();
  });

  test('the recorded feed reproduces the committed snapshot', async () => {
    const { fetch } = fakeFetch(recorded);
    const live = await fetchBackCatalogue(feed, { fetch, today });
    expect({ ...live, retrieved: '' }).toEqual({
      ...readBackCatalogue(),
      retrieved: '',
    });
  });

  test('asks for the feed the snapshot names', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    await fetchBackCatalogue(readBackCatalogue().feed, { fetch, today });
    expect(requests).toEqual([feed]);
  });

  test('links each post at its slug beside the feed', async () => {
    const { fetch } = fakeFetch(recorded);
    const { posts } = await fetchBackCatalogue(feed, { fetch, today });
    expect(posts.map((post) => post.url)).toContain(
      'https://www.dj-elliott.com/blog/derive-vfe',
    );
  });

  test('lists posts newest first whatever order the feed uses', async () => {
    const { fetch } = fakeFetch([...recorded].reverse());
    const { posts } = await fetchBackCatalogue(feed, { fetch, today });
    const dates = posts.map((post) => post.published);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test('keeps the date a post was updated', async () => {
    const { fetch } = fakeFetch(recorded);
    const { posts } = await fetchBackCatalogue(feed, { fetch, today });
    const derivation = posts.find((post) => post.url.endsWith('/derive-vfe'));
    expect(derivation?.updated).toBe('2026-06-10');
  });

  test('refuses an update that predates publication', async () => {
    const early = [{ ...recorded[0], date: '2026-06-01', updated: '2026-05-01' }];
    const { fetch } = fakeFetch(early);
    await expect(fetchBackCatalogue(feed, { fetch, today })).rejects.toThrow();
  });

  test('refuses a post with no date', async () => {
    const undated = { ...recorded[0] };
    delete undated.date;
    const { fetch } = fakeFetch([undated]);
    await expect(fetchBackCatalogue(feed, { fetch, today })).rejects.toThrow();
  });

  test('fails on an HTTP error and names the status', async () => {
    const { fetch } = fakeFetch({}, 503);
    await expect(fetchBackCatalogue(feed, { fetch, today })).rejects.toThrow(
      'HTTP 503',
    );
  });

  test('a local build reads the snapshot', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    const catalogue = await resolveBackCatalogue({ env: {}, fetch, today });
    expect(requests).toHaveLength(0);
    expect(catalogue).toEqual(readBackCatalogue());
  });

  test('CI reads the feed live', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    await resolveBackCatalogue({ env: { CI: 'true' }, fetch, today });
    expect(requests).toEqual([feed]);
  });
});
