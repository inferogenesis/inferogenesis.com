import { arxivId, type ResearchRecord } from './datacite';

interface Artefact {
  label: string;
  url: string;
}

// Schema.org for a research entry. The page shows the same record, so the two cannot
// disagree.
export function scholarlyWork(
  record: ResearchRecord,
  artefacts: Artefact[],
  pageUrl: string,
  organisations: string[] = ['Inferogenesis'],
) {
  const arxiv = arxivId(record.doi);
  return {
    '@context': 'https://schema.org',
    '@type': record.kind === 'dataset' ? 'Dataset' : 'ScholarlyArticle',
    name: record.title,
    headline: record.title,
    author: record.authors.map((name) => ({
      '@type': organisations.includes(name) ? 'Organization' : 'Person',
      name,
    })),
    datePublished: record.published,
    abstract: record.abstract,
    license: record.licence.url,
    publisher: { '@type': 'Organization', name: record.publisher },
    url: pageUrl,
    identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: record.doi },
    sameAs: [
      `https://doi.org/${record.doi}`,
      ...(arxiv ? [`https://arxiv.org/abs/${arxiv}`] : []),
    ],
    ...(artefacts.length > 0 && {
      isBasedOn: artefacts.map((artefact) => ({
        '@type': 'CreativeWork',
        name: artefact.label,
        url: artefact.url,
      })),
    }),
  };
}

const context = 'https://schema.org';

// The organisation, on every page, so search engines tie each page to one publisher.
export function organisation(site: string) {
  const home = new URL('/', site).href;
  return {
    '@context': context,
    '@type': 'Organization',
    name: 'Inferogenesis',
    url: home,
    logo: new URL('/icon-512.png', site).href,
    sameAs: ['https://github.com/inferogenesis'],
  };
}

interface Software {
  name: string;
  description: string;
  licence: string;
  repo: string;
  docs: string;
  doi?: string;
  authors: string[];
  pypi?: string;
}

// A project at its latest release. The page reads the same release, so the version here
// is the version on the badge.
export function softwareSourceCode(
  project: Software,
  release: { version: string; published: string },
  pythonRange: string | null,
  pageUrl: string,
) {
  return {
    '@context': context,
    '@type': 'SoftwareSourceCode',
    name: project.name,
    description: project.description,
    url: pageUrl,
    codeRepository: project.repo,
    ...(project.pypi && { programmingLanguage: 'Python' }),
    ...(project.pypi && pythonRange && { runtimePlatform: `Python ${pythonRange}` }),
    softwareVersion: release.version,
    datePublished: release.published,
    license: `https://spdx.org/licenses/${project.licence}.html`,
    author: project.authors.map((name) => ({ '@type': 'Organization', name })),
    ...(project.doi && {
      identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: project.doi },
    }),
    sameAs: [...(project.doi ? [`https://doi.org/${project.doi}`] : []), project.docs],
  };
}

// JSON inside a script element must not be able to close it.
export function serialiseStructuredData(data: object): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
