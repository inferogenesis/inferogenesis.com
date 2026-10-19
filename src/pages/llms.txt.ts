import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { backCatalogue } from '../lib/backCatalogue';
import { researchRecord } from '../lib/datacite';
import { proposalRecord } from '../lib/discussions';
import { llmsText } from '../lib/llmsText';
import { listProjects } from '../lib/projects';
import { citationFileUrl, projectReleases } from '../lib/releases';

export const GET: APIRoute = async ({ site }) => {
  const projects = await Promise.all(
    (await listProjects()).map(async (entry) => {
      const snapshot = await projectReleases(entry.id);
      return {
        path: `/projects/${entry.id}/`,
        name: entry.data.name,
        description: entry.data.description,
        docs: entry.data.docs,
        install: entry.data.install,
        doi: entry.data.doi,
        citationFile: entry.data.hasCitationFile
          ? citationFileUrl(snapshot)
          : undefined,
        release: snapshot.releases[0],
      };
    }),
  );
  const research = await Promise.all(
    (await getCollection('research')).map(async (entry) => ({
      ...(await researchRecord(entry.id, entry.data.doi)),
      path: `/research/${entry.id}/`,
    })),
  );
  research.sort((a, b) => b.published.localeCompare(a.published));
  const programmes = (await getCollection('programmes'))
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((entry) => ({
      path: `/programmes/${entry.id}/`,
      title: entry.data.title,
      note: entry.data.question,
    }));
  const proposals = (
    await Promise.all(
      (await getCollection('proposals')).map(async (entry) => ({
        entry,
        record: await proposalRecord(entry.id, entry.data.discussion),
      })),
    )
  )
    .sort((a, b) => b.record.opened.localeCompare(a.record.opened))
    .map(({ entry, record }) => ({
      path: `/proposals/${entry.id}/`,
      title: record.title,
      note: `${record.status}. ${record.size}. Respond on ${record.discussion}.`,
    }));
  const pages = (await getCollection('pages'))
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((entry) => ({
      path: `/${entry.id}/`,
      title: entry.data.title,
      note: entry.data.description,
    }));

  const body = llmsText({
    site: site?.href ?? 'https://inferogenesis.com/',
    tagline: 'continuous active inference, from the first cell',
    summary:
      'Inferogenesis builds open-source software for continuous active inference, and the research that tests it. Each version and date below comes from the release data at build time.',
    projects,
    research,
    programmes,
    proposals,
    writing: (await backCatalogue()).posts,
    pages,
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
