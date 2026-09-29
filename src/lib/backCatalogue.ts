import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type BackCatalogue,
  type LinkedPost,
  backCatalogueSchema,
} from '../content/schemas';
import { type Env, readsLiveData } from './liveData';
import type { FetchOptions } from './releases';

export type { BackCatalogue, LinkedPost };

interface FeedPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  updated?: string;
}

interface ResolveOptions extends FetchOptions {
  env?: Env;
}

const snapshotPath = join(process.cwd(), 'data', 'writing', 'back-catalogue.json');
const utcToday = () => new Date().toISOString().slice(0, 10);

export function readBackCatalogue(): BackCatalogue {
  const parsed = backCatalogueSchema.safeParse(
    JSON.parse(readFileSync(snapshotPath, 'utf8')),
  );
  if (!parsed.success) {
    throw new Error(
      `${snapshotPath} is not a valid back catalogue: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

// The feed lists each post by slug. A post lives at that slug beside the feed file.
export async function fetchBackCatalogue(
  feed: string,
  { fetch = globalThis.fetch, today = utcToday }: FetchOptions = {},
): Promise<BackCatalogue> {
  const response = await fetch(feed);
  if (!response.ok) throw new Error(`Back catalogue ${feed}: HTTP ${response.status}`);
  const posts = ((await response.json()) as FeedPost[])
    .map((post) => ({
      title: post.title,
      summary: post.summary,
      published: post.date,
      ...(post.updated && { updated: post.updated }),
      url: new URL(post.slug, feed).href,
    }))
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''));
  return backCatalogueSchema.parse({ feed, retrieved: today(), posts });
}

export async function resolveBackCatalogue({
  env = process.env,
  ...options
}: ResolveOptions = {}): Promise<BackCatalogue> {
  const snapshot = readBackCatalogue();
  return readsLiveData(env) ? fetchBackCatalogue(snapshot.feed, options) : snapshot;
}

let perBuild: Promise<BackCatalogue> | undefined;

export function backCatalogue(): Promise<BackCatalogue> {
  perBuild ??= resolveBackCatalogue();
  return perBuild;
}
