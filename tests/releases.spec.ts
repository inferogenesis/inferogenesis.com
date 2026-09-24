import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { releaseSnapshotSchema } from '../src/content/schemas';
import {
  fetchGithubReleases,
  latestReleases,
  readReleaseSnapshot,
  resolveReleaseSnapshot,
} from '../src/lib/releases';

const projectIds = readdirSync('src/content/projects')
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''));

const githubSnapshot = {
  source: 'github-releases',
  repository: 'inferogenesis/cpomdp',
  retrieved: '2026-09-24',
  releases: [
    {
      releaseTag: 'v0.4.4',
      version: '0.4.4',
      published: '2026-08-04',
      url: 'https://github.com/a/b',
    },
    {
      releaseTag: 'v0.4.3',
      version: '0.4.3',
      published: '2026-07-28',
      url: 'https://github.com/a/c',
    },
  ],
};

test.describe('release snapshots', () => {
  for (const id of projectIds) {
    test(`${id} has a committed snapshot that validates`, () => {
      expect(() => readReleaseSnapshot(id)).not.toThrow();
    });
  }

  test('keeps at most five releases, newest first', () => {
    const releases = Array.from({ length: 7 }, (_, index) => ({
      releaseTag: `v0.${9 - index}.0`,
      version: `0.${9 - index}.0`,
      published: `2026-0${9 - index}-01`,
      url: 'https://github.com/a/b',
    }));
    const snapshot = releaseSnapshotSchema.parse({ ...githubSnapshot, releases });
    expect(latestReleases(snapshot).map((release) => release.version)).toEqual([
      '0.9.0',
      '0.8.0',
      '0.7.0',
      '0.6.0',
      '0.5.0',
    ]);
  });

  test('rejects releases out of date order', () => {
    const releases = [...githubSnapshot.releases].reverse();
    expect(
      releaseSnapshotSchema.safeParse({ ...githubSnapshot, releases }).success,
    ).toBe(false);
  });

  test('rejects a GitHub release without its tag', () => {
    const releases = [{ ...githubSnapshot.releases[0], releaseTag: undefined }];
    expect(
      releaseSnapshotSchema.safeParse({ ...githubSnapshot, releases }).success,
    ).toBe(false);
  });

  test('accepts a PyPI release without a tag', () => {
    const snapshot = {
      source: 'pypi',
      package: 'warrantlib',
      retrieved: '2026-09-24',
      releases: [
        { version: '0.3.0', published: '2026-08-26', url: 'https://pypi.org/p/w' },
      ],
    };
    expect(releaseSnapshotSchema.safeParse(snapshot).success).toBe(true);
  });

  test('rejects a date that is not ISO 8601', () => {
    const releases = [{ ...githubSnapshot.releases[0], published: '4 Aug 2026' }];
    expect(
      releaseSnapshotSchema.safeParse({ ...githubSnapshot, releases }).success,
    ).toBe(false);
  });

  test('rejects a snapshot that does not say when it was retrieved', () => {
    const snapshot = { ...githubSnapshot, retrieved: undefined };
    expect(releaseSnapshotSchema.safeParse(snapshot).success).toBe(false);
  });
});

const recorded = JSON.parse(
  readFileSync('tests/fixtures/github-releases-cpomdp.json', 'utf8'),
);
const today = () => '2026-09-24';

function fakeFetch(body: unknown, status = 200) {
  const requests: { url: string; headers: Headers }[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(body), { status });
  };
  return { fetch, requests };
}

test.describe('GitHub releases at build time', () => {
  test('the recorded API response reproduces the committed snapshot', async () => {
    const { fetch } = fakeFetch(recorded);
    const live = await fetchGithubReleases('inferogenesis/cpomdp', 'token', {
      fetch,
      today,
    });
    expect(latestReleases(live)).toEqual(readReleaseSnapshot('cpomdp').releases);
  });

  test('asks the releases API for the repository, with the token', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    await fetchGithubReleases('inferogenesis/cpomdp', 'secret', { fetch, today });
    expect(requests[0].url).toBe(
      'https://api.github.com/repos/inferogenesis/cpomdp/releases?per_page=20',
    );
    expect(requests[0].headers.get('authorization')).toBe('Bearer secret');
    expect(requests[0].headers.get('accept')).toBe('application/vnd.github+json');
  });

  test('skips drafts and prereleases', async () => {
    const extra = [
      { ...recorded[0], tag_name: 'v0.5.0', draft: true, published_at: null },
      { ...recorded[0], tag_name: 'v0.5.0rc1', prerelease: true },
    ];
    const { fetch } = fakeFetch([...extra, ...recorded]);
    const live = await fetchGithubReleases('inferogenesis/cpomdp', 'token', {
      fetch,
      today,
    });
    expect(live.releases[0].releaseTag).toBe('v0.4.4');
  });

  test('fails on an HTTP error and names the status', async () => {
    const { fetch } = fakeFetch({ message: 'Bad credentials' }, 401);
    await expect(
      fetchGithubReleases('inferogenesis/cpomdp', 'token', { fetch, today }),
    ).rejects.toThrow('HTTP 401');
  });

  test('a local build without a token reads the committed snapshot', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    const snapshot = await resolveReleaseSnapshot('cpomdp', { env: {}, fetch, today });
    expect(requests).toHaveLength(0);
    expect(snapshot).toEqual(readReleaseSnapshot('cpomdp'));
  });

  test('a CI build without a token fails instead of shipping the snapshot', async () => {
    const { fetch } = fakeFetch(recorded);
    await expect(
      resolveReleaseSnapshot('cpomdp', { env: { CI: 'true' }, fetch, today }),
    ).rejects.toThrow('GITHUB_TOKEN');
  });

  test('a build with a token reads the releases live', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    const env = { CI: 'true', GITHUB_TOKEN: 'token' };
    const snapshot = await resolveReleaseSnapshot('cpomdp', { env, fetch, today });
    expect(requests).toHaveLength(1);
    expect(snapshot.retrieved).toBe('2026-09-24');
  });

  test('a PyPI-only project stays on its snapshot even with a token', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    const env = { CI: 'true', GITHUB_TOKEN: 'token' };
    await resolveReleaseSnapshot('warrantlib', { env, fetch, today });
    expect(requests).toHaveLength(0);
  });
});

test.describe('release lists on project pages', () => {
  // CI builds read live releases, so these assert the list's shape, not a version.
  test('cpomdp lists at most five GitHub releases, newest first', async ({ page }) => {
    await page.goto('/projects/cpomdp/');
    const items = page.locator('ul.releases li');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
    const dates = await items
      .locator('time')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime') ?? ''));
    expect(dates).toEqual([...dates].sort().reverse());
    await expect(items.first().getByRole('link')).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/inferogenesis\/cpomdp\/releases\/tag\/v/,
    );
  });

  test('warrantlib lists its PyPI releases by version', async ({ page }) => {
    await page.goto('/projects/warrantlib/');
    const items = page.locator('ul.releases li');
    await expect(items.first()).toContainText('0.3.0');
    await expect(items.first().getByRole('link')).toHaveAttribute(
      'href',
      'https://pypi.org/project/warrantlib/0.3.0/',
    );
  });
});
