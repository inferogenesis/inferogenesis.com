import type { LinkedPost, Release, ResearchRecord } from '../content/schemas';

export interface LlmsProject {
  path: string;
  name: string;
  description: string;
  docs: string;
  install: string;
  doi?: string;
  citationFile?: string;
  release: Release;
}

export interface LlmsLink {
  path: string;
  title: string;
  note: string;
}

export interface LlmsSite {
  site: string;
  tagline: string;
  summary: string;
  projects: LlmsProject[];
  research: (ResearchRecord & { path: string })[];
  programmes: LlmsLink[];
  writing: LinkedPost[];
  pages: LlmsLink[];
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

function projectLine(project: LlmsProject, site: string): string {
  const cite = [
    project.doi && `DOI ${project.doi}`,
    project.citationFile && `CITATION.cff at ${project.citationFile}`,
  ].filter(Boolean);
  return [
    `- [${project.name}](${new URL(project.path, site).href}): ${oneLine(project.description)}`,
    `Latest release version ${project.release.version} on ${project.release.published}.`,
    `Docs at ${project.docs}.`,
    `Install with \`${project.install}\`.`,
    ...(cite.length ? [`Cite ${cite.join(', or the ')}.`] : []),
  ].join(' ');
}

function researchLine(record: LlmsSite['research'][number], site: string): string {
  return [
    `- [${oneLine(record.title)}](${new URL(record.path, site).href}):`,
    `${record.authors.join(', ')}, ${record.kind}, ${record.publisher}, ${record.published}.`,
    `DOI ${record.doi}.`,
  ].join(' ');
}

function postLine(post: LinkedPost): string {
  const dates = post.updated
    ? `Published ${post.published}, updated ${post.updated}.`
    : `Published ${post.published}.`;
  const summary = oneLine(post.summary).replace(/([^.!?])$/, '$1.');
  return `- [${oneLine(post.title)}](${post.url}): ${summary} ${dates}`;
}

const linkLine = (link: LlmsLink, site: string) =>
  `- [${link.title}](${new URL(link.path, site).href}): ${oneLine(link.note)}`;

// The llmstxt.org shape: a title, a quoted summary, then sections of annotated links.
export function llmsText(input: LlmsSite): string {
  const sections: [string, string[]][] = [
    ['Projects', input.projects.map((project) => projectLine(project, input.site))],
    ['Research', input.research.map((record) => researchLine(record, input.site))],
    ['Programmes', input.programmes.map((link) => linkLine(link, input.site))],
    ['Writing', input.writing.map(postLine)],
    ['Optional', input.pages.map((link) => linkLine(link, input.site))],
  ];
  return [
    '# Inferogenesis',
    `> ${input.tagline}`,
    oneLine(input.summary),
    ...sections
      .filter(([, lines]) => lines.length)
      .map(([heading, lines]) => [`## ${heading}`, '', ...lines].join('\n')),
  ]
    .join('\n\n')
    .concat('\n');
}
