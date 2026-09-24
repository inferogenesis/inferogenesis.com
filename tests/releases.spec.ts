import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { releaseSnapshotSchema } from '../src/content/schemas';
import { latestReleases, readReleaseSnapshot } from '../src/lib/releases';

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

test.describe('release lists on project pages', () => {
  test('cpomdp lists its five latest GitHub releases, newest first', async ({
    page,
  }) => {
    await page.goto('/projects/cpomdp/');
    const items = page.locator('ul.releases li');
    await expect(items).toHaveCount(5);
    await expect(items.first()).toContainText('v0.4.4');
    await expect(items.first().locator('time')).toHaveAttribute(
      'datetime',
      '2026-08-04',
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
