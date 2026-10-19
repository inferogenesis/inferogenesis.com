import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type ProposalBlock,
  type ProposalRecord,
  proposalRecordSchema,
} from '../content/schemas';
import { type Env, readsLiveData } from './liveData';
import type { FetchOptions } from './releases';

export type { ProposalBlock, ProposalRecord };

interface GithubDiscussion {
  title: string;
  body: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: { login: string };
  category: { name: string };
}

interface ResolveOptions extends FetchOptions {
  env?: Env;
}

// The discussion category whose form a proposal is written in. Its headings are the
// form's fields.
export const proposalCategory = 'Research Questions';

const utcToday = () => new Date().toISOString().slice(0, 10);

// GitHub writes this in place of a form field left empty.
const noResponse = '_No response_';

function sections(body: string): Map<string, string> {
  const found = new Map<string, string>();
  let heading: string | undefined;
  let lines: string[] = [];
  const close = () => {
    const text = lines.join('\n').trim();
    if (heading && text && text !== noResponse) found.set(heading, text);
  };
  for (const line of body.replace(/\r\n?/g, '\n').split('\n')) {
    const match = /^###\s+(.+?)\s*$/.exec(line);
    if (match) {
      close();
      heading = match[1];
      lines = [];
    } else {
      lines.push(line);
    }
  }
  close();
  return found;
}

// Paragraphs and bullet lists, the two shapes the form's long answers take.
export function blocks(text: string): ProposalBlock[] {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split('\n').map((line) => line.trim());
      if (!lines[0].startsWith('- ')) {
        return { type: 'paragraph', text: lines.join(' ') };
      }
      const items: string[] = [];
      for (const line of lines) {
        if (line.startsWith('- ')) items.push(line.slice(2).trim());
        else items[items.length - 1] += ` ${line}`;
      }
      return { type: 'list', items };
    });
}

// A comma-separated answer, where a comma inside parentheses belongs to its item.
export function commaList(text: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      items.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  items.push(current);
  return items.map((item) => item.trim()).filter(Boolean);
}

export function discussionApiUrl(discussion: string): string {
  const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/discussions\/(\d+)$/.exec(
    discussion,
  );
  if (!match) throw new Error(`${discussion} is not a GitHub discussion URL.`);
  return `https://api.github.com/repos/${match[1]}/discussions/${match[2]}`;
}

export function readProposalRecord(entryId: string): ProposalRecord {
  const path = join(process.cwd(), 'data', 'proposals', `${entryId}.json`);
  const parsed = proposalRecordSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    throw new Error(`${path} is not a valid proposal record: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function fetchProposalRecord(
  discussion: string,
  token: string,
  { fetch = globalThis.fetch, today = utcToday }: FetchOptions = {},
): Promise<ProposalRecord> {
  const response = await fetch(discussionApiUrl(discussion), {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`GitHub ${discussion}: HTTP ${response.status}`);
  const found = (await response.json()) as GithubDiscussion;
  if (found.category.name !== proposalCategory) {
    throw new Error(
      `${discussion} is in "${found.category.name}", and a proposal is a ${proposalCategory} discussion.`,
    );
  }
  const fields = sections(found.body);
  const field = (name: string) => fields.get(name) ?? '';
  return proposalRecordSchema.parse({
    discussion: found.html_url,
    title: found.title,
    author: found.user.login,
    opened: found.created_at.slice(0, 10),
    updated: found.updated_at.slice(0, 10),
    question: blocks(field('The question')),
    firstResult: blocks(field('What a first result looks like')),
    kind: commaList(field('Kind of work')),
    size: field('Rough size') || undefined,
    status: field('Status') || undefined,
    skills: commaList(field('Skills that would help')),
    retrieved: today(),
  });
}

// CI reads each discussion live and fails without a token. A local build without one
// reads the committed snapshot.
export async function resolveProposalRecord(
  entryId: string,
  discussion: string,
  { env = process.env, ...options }: ResolveOptions = {},
): Promise<ProposalRecord> {
  if (readsLiveData(env)) {
    const token = env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(`CI reads ${discussion} live and needs GITHUB_TOKEN.`);
    }
    return fetchProposalRecord(discussion, token, options);
  }
  const snapshot = readProposalRecord(entryId);
  if (snapshot.discussion !== discussion) {
    throw new Error(
      `data/proposals/${entryId}.json is for ${snapshot.discussion}, and the entry names ${discussion}.`,
    );
  }
  return snapshot;
}

const perBuild = new Map<string, Promise<ProposalRecord>>();

export function proposalRecord(
  entryId: string,
  discussion: string,
): Promise<ProposalRecord> {
  let record = perBuild.get(entryId);
  if (!record) {
    record = resolveProposalRecord(entryId, discussion);
    perBuild.set(entryId, record);
  }
  return record;
}
