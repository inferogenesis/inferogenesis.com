import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type ResearchRecord, researchRecordSchema } from '../content/schemas';
import { type Env, readsLiveData } from './liveData';
import type { FetchOptions } from './releases';

export type { ResearchRecord };

interface DataciteCreator {
  name: string;
  nameType?: string;
  givenName?: string;
  familyName?: string;
}

interface DataciteAttributes {
  doi: string;
  creators: DataciteCreator[];
  titles: { title: string }[];
  descriptions: { description: string; descriptionType?: string }[];
  rightsList: { rights: string; rightsUri?: string; rightsIdentifier?: string }[];
  types: { resourceTypeGeneral: string };
  dates: { date: string; dateType: string }[];
  publisher: string;
}

interface ResolveOptions extends FetchOptions {
  env?: Env;
}

const kinds: Record<string, ResearchRecord['kind']> = {
  Preprint: 'preprint',
  JournalArticle: 'paper',
  ConferencePaper: 'paper',
  Text: 'paper',
  Dataset: 'dataset',
};

// The first of these that DataCite holds as a full date is the one the list shows.
const dateOrder = ['Issued', 'Submitted', 'Available', 'Created'];

const utcToday = () => new Date().toISOString().slice(0, 10);

function authorName(creator: DataciteCreator): string {
  if (creator.nameType === 'Personal' && creator.givenName && creator.familyName) {
    return `${creator.givenName} ${creator.familyName}`;
  }
  return creator.name;
}

function licenceName({
  rights,
  rightsIdentifier,
}: DataciteAttributes['rightsList'][number]) {
  if (rightsIdentifier?.startsWith('cc-')) {
    return rightsIdentifier.toUpperCase().replaceAll('-', ' ');
  }
  return rights;
}

function publishedDate(dates: DataciteAttributes['dates']): string | undefined {
  for (const dateType of dateOrder) {
    const found = dates.find((entry) => entry.dateType === dateType);
    if (found && /^\d{4}-\d{2}-\d{2}/.test(found.date)) return found.date.slice(0, 10);
  }
  return undefined;
}

// arXiv mints DataCite DOIs of the form 10.48550/arXiv.<id>.
export function arxivId(doi: string): string | undefined {
  return /^10\.48550\/arxiv\.(.+)$/i.exec(doi)?.[1];
}

export function readResearchRecord(entryId: string): ResearchRecord {
  const path = join(process.cwd(), 'data', 'research', `${entryId}.json`);
  const parsed = researchRecordSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    throw new Error(`${path} is not a valid research record: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function fetchResearchRecord(
  doi: string,
  { fetch = globalThis.fetch, today = utcToday }: FetchOptions = {},
): Promise<ResearchRecord> {
  const response = await fetch(`https://api.datacite.org/dois/${doi}`);
  if (!response.ok) throw new Error(`DataCite ${doi}: HTTP ${response.status}`);
  const { attributes } = (
    (await response.json()) as { data: { attributes: DataciteAttributes } }
  ).data;
  const kind = kinds[attributes.types.resourceTypeGeneral];
  if (!kind) {
    throw new Error(
      `DataCite ${doi}: no list kind for "${attributes.types.resourceTypeGeneral}".`,
    );
  }
  const [rights] = attributes.rightsList;
  return researchRecordSchema.parse({
    doi,
    title: attributes.titles[0]?.title,
    kind,
    authors: attributes.creators.map(authorName),
    published: publishedDate(attributes.dates),
    publisher: attributes.publisher,
    abstract: attributes.descriptions.find(
      (entry) => entry.descriptionType === 'Abstract',
    )?.description,
    licence: rights && { name: licenceName(rights), url: rights.rightsUri },
    retrieved: today(),
  });
}

export async function resolveResearchRecord(
  entryId: string,
  doi: string,
  { env = process.env, ...options }: ResolveOptions = {},
): Promise<ResearchRecord> {
  if (readsLiveData(env)) return fetchResearchRecord(doi, options);
  const snapshot = readResearchRecord(entryId);
  if (snapshot.doi.toLowerCase() !== doi.toLowerCase()) {
    throw new Error(
      `data/research/${entryId}.json is for ${snapshot.doi}, and the entry names ${doi}.`,
    );
  }
  return snapshot;
}

const perBuild = new Map<string, Promise<ResearchRecord>>();

export function researchRecord(entryId: string, doi: string): Promise<ResearchRecord> {
  let record = perBuild.get(entryId);
  if (!record) {
    record = resolveResearchRecord(entryId, doi);
    perBuild.set(entryId, record);
  }
  return record;
}
