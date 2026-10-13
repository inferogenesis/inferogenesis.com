import { getCollection, type CollectionEntry } from 'astro:content';

export type AppliedWriteUp = CollectionEntry<'applied'>;

// The directory a write-up sits in names its project, and its file names the page.
export function appliedParts(writeUp: AppliedWriteUp): {
  project: string;
  name: string;
} {
  const [project, name, ...deeper] = writeUp.id.split('/');
  if (!name || deeper.length > 0) {
    throw new Error(
      `${writeUp.id}: a write-up sits one directory deep, in its project's directory`,
    );
  }
  return { project, name };
}

export function appliedPath(writeUp: AppliedWriteUp): string {
  const { project, name } = appliedParts(writeUp);
  return `/projects/${project}/applied/${name}/`;
}

// Newest first, so a project page leads with its latest write-up.
export async function appliedWriteUps(project: string): Promise<AppliedWriteUp[]> {
  const writeUps = await getCollection(
    'applied',
    (writeUp) => appliedParts(writeUp).project === project,
  );
  return writeUps.sort(
    (a, b) => b.data.published.valueOf() - a.data.published.valueOf(),
  );
}
