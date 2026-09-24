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

// JSON inside a script element must not be able to close it.
export function serialiseStructuredData(data: object): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
