import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type Release,
  type ReleaseSnapshot,
  releaseSnapshotSchema,
} from '../content/schemas';

export type { Release, ReleaseSnapshot };

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
