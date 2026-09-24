import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { fetchPythonRange, readPythonRange, resolvePythonRange } from '../src/lib/pypi';

const recorded = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/pypi-${name}.json`, 'utf8'));
const today = () => '2026-09-24';

function fakeFetch(body: unknown, status = 200) {
  const requests: string[] = [];
  const fetch = async (input: string) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), { status });
  };
  return { fetch, requests };
}

const projectsWithPypi = readdirSync('src/content/projects')
  .filter((name) => name.endsWith('.mdx'))
  .filter((name) =>
    /^pypi: /m.test(readFileSync(`src/content/projects/${name}`, 'utf8')),
  )
  .map((name) => name.replace(/\.mdx$/, ''));

test.describe('Python range from PyPI', () => {
  for (const id of projectsWithPypi) {
    test(`${id} has a committed PyPI snapshot that validates`, () => {
      expect(() => readPythonRange(id)).not.toThrow();
    });
  }

  for (const [id, version] of [
    ['cpomdp', '0.4.4'],
    ['warrantlib', '0.3.0'],
  ]) {
    test(`the recorded response for ${id} ${version} reproduces the committed snapshot`, async () => {
      const { fetch } = fakeFetch(recorded(`${id}-${version}`));
      const live = await fetchPythonRange(id, version, { fetch, today });
      expect({ ...live, retrieved: '' }).toEqual({
        ...readPythonRange(id),
        retrieved: '',
      });
    });
  }

  test('asks PyPI for the released version, not the latest', async () => {
    const { fetch, requests } = fakeFetch(recorded('cpomdp-0.4.4'));
    await fetchPythonRange('cpomdp', '0.4.4', { fetch, today });
    expect(requests).toEqual(['https://pypi.org/pypi/cpomdp/0.4.4/json']);
  });

  test('fails on an HTTP error and names the status', async () => {
    const { fetch } = fakeFetch({ message: 'Not Found' }, 404);
    await expect(fetchPythonRange('cpomdp', '9.9.9', { fetch, today })).rejects.toThrow(
      'HTTP 404',
    );
  });

  test('a local build reads the snapshot for the release it shows', async () => {
    const { fetch, requests } = fakeFetch(recorded('cpomdp-0.4.4'));
    const range = await resolvePythonRange('cpomdp', 'cpomdp', '0.4.4', {
      env: {},
      fetch,
      today,
    });
    expect(requests).toHaveLength(0);
    expect(range.requiresPython).toBe('>=3.10');
  });

  test('a local build fails when the snapshot is for another version', async () => {
    const { fetch } = fakeFetch(recorded('cpomdp-0.4.4'));
    await expect(
      resolvePythonRange('cpomdp', 'cpomdp', '0.4.5', { env: {}, fetch, today }),
    ).rejects.toThrow('0.4.5');
  });

  test('a live build asks PyPI for the release it shows', async () => {
    const { fetch, requests } = fakeFetch(recorded('cpomdp-0.4.4'));
    const env = { CI: 'true', GITHUB_TOKEN: 'token' };
    await resolvePythonRange('cpomdp', 'cpomdp', '0.4.4', { env, fetch, today });
    expect(requests).toEqual(['https://pypi.org/pypi/cpomdp/0.4.4/json']);
  });
});

test.describe('Python range on project pages', () => {
  for (const id of ['cpomdp', 'warrantlib']) {
    test(`${id} states a Python range`, async ({ page }) => {
      await page.goto(`/projects/${id}/`);
      await expect(page.locator('main')).toContainText(/Python [<>=!~]=?\s*3\.\d+/);
    });
  }
});
