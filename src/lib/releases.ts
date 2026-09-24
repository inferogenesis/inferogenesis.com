import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type Release,
  type ReleaseSnapshot,
  releaseSnapshotSchema,
} from '../content/schemas';
import { type Env, readsLiveData } from './liveData';

export type { Release, ReleaseSnapshot };

interface GithubRelease {
  tag_name: string;
  published_at: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
}

export interface FetchOptions {
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  today?: () => string;
}

interface ResolveOptions extends FetchOptions {
  env?: Env;
}

const utcToday = () => new Date().toISOString().slice(0, 10);

export function readReleaseSnapshot(projectId: string): ReleaseSnapshot {
  const path = join(process.cwd(), 'data', 'releases', `${projectId}.json`);
  const parsed = releaseSnapshotSchema.safeParse(
    JSON.parse(readFileSync(path, 'utf8')),
  );
  if (!parsed.success) {
    throw new Error(`${path} is not a valid release snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function latestReleases(snapshot: ReleaseSnapshot, count = 5): Release[] {
  return snapshot.releases.slice(0, count);
}

export async function fetchGithubReleases(
  repository: string,
  token: string,
  { fetch = globalThis.fetch, today = utcToday }: FetchOptions = {},
): Promise<ReleaseSnapshot> {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/releases?per_page=20`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub releases for ${repository}: HTTP ${response.status}`);
  }
  const published = ((await response.json()) as GithubRelease[])
    .filter((release) => !release.draft && !release.prerelease && release.published_at)
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
  return releaseSnapshotSchema.parse({
    source: 'github-releases',
    repository,
    retrieved: today(),
    releases: published.map((release) => ({
      releaseTag: release.tag_name,
      version: release.tag_name.replace(/^v/, ''),
      published: (release.published_at ?? '').slice(0, 10),
      url: release.html_url,
    })),
  });
}

// CI reads releases live and fails without a token, so a deploy never ships stale data
// silently. A local build without a token reads the committed snapshot.
export async function resolveReleaseSnapshot(
  projectId: string,
  { env = process.env, ...options }: ResolveOptions = {},
): Promise<ReleaseSnapshot> {
  const snapshot = readReleaseSnapshot(projectId);
  if (snapshot.source !== 'github-releases' || !readsLiveData(env)) return snapshot;
  const token = env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      `CI reads ${snapshot.repository} releases live and needs GITHUB_TOKEN.`,
    );
  }
  return fetchGithubReleases(snapshot.repository, token, options);
}

const perBuild = new Map<string, Promise<ReleaseSnapshot>>();

// One resolution per project per build, so the page, its card and the landing grid agree
// and CI asks GitHub once.
export function projectReleases(projectId: string): Promise<ReleaseSnapshot> {
  let snapshot = perBuild.get(projectId);
  if (!snapshot) {
    snapshot = resolveReleaseSnapshot(projectId);
    perBuild.set(projectId, snapshot);
  }
  return snapshot;
}

export function citationFileUrl(snapshot: ReleaseSnapshot): string | undefined {
  if (snapshot.source !== 'github-releases') return undefined;
  const [latest] = snapshot.releases;
  return `https://github.com/${snapshot.repository}/blob/${latest.releaseTag}/CITATION.cff`;
}
