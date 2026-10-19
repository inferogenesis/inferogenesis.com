import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import {
  blocks,
  commaList,
  fetchProposalRecord,
  readProposalRecord,
  resolveProposalRecord,
} from '../src/lib/discussions';
import { inlineSegments } from '../src/lib/inline';

const recorded = JSON.parse(
  readFileSync('tests/fixtures/github-discussion-cpomdp-192.json', 'utf8'),
);
const discussion = 'https://github.com/inferogenesis/cpomdp/discussions/192';
const entryId = 'uncertainty-aware-anti-surge';
const today = () => '2026-10-18';

function fakeFetch(body: unknown, status = 200) {
  const requests: { url: string; headers: Headers }[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(body), { status });
  };
  return { fetch, requests };
}

const entryIds = readdirSync('src/content/proposals')
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''));

test.describe('proposals from GitHub discussions', () => {
  for (const id of entryIds) {
    test(`${id} has a committed discussion snapshot that validates`, () => {
      expect(() => readProposalRecord(id)).not.toThrow();
    });
  }

  test('the recorded response reproduces the committed snapshot', async () => {
    const { fetch } = fakeFetch(recorded);
    const live = await fetchProposalRecord(discussion, 'token', { fetch, today });
    expect({ ...live, retrieved: '' }).toEqual({
      ...readProposalRecord(entryId),
      retrieved: '',
    });
  });

  test('asks the discussions API for the number, with the token', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    await fetchProposalRecord(discussion, 'secret', { fetch, today });
    expect(requests[0].url).toBe(
      'https://api.github.com/repos/inferogenesis/cpomdp/discussions/192',
    );
    expect(requests[0].headers.get('authorization')).toBe('Bearer secret');
  });

  test('refuses a discussion outside Research Questions', async () => {
    const { fetch } = fakeFetch({ ...recorded, category: { name: 'Announcements' } });
    await expect(
      fetchProposalRecord(discussion, 'token', { fetch, today }),
    ).rejects.toThrow('Announcements');
  });

  test('refuses a discussion whose form has no question', async () => {
    const body = recorded.body.replace('### The question', '### Something else');
    const { fetch } = fakeFetch({ ...recorded, body });
    await expect(
      fetchProposalRecord(discussion, 'token', { fetch, today }),
    ).rejects.toThrow();
  });

  test('treats a field GitHub marks empty as absent', async () => {
    const body = recorded.body.replace(
      /### Skills that would help[\s\S]*?(?=\n### )/,
      '### Skills that would help\n\n_No response_\n',
    );
    const { fetch } = fakeFetch({ ...recorded, body });
    const record = await fetchProposalRecord(discussion, 'token', { fetch, today });
    expect(record.skills).toEqual([]);
  });

  test('fails on an HTTP error and names the status', async () => {
    const { fetch } = fakeFetch({ message: 'Not Found' }, 404);
    await expect(
      fetchProposalRecord(discussion, 'token', { fetch, today }),
    ).rejects.toThrow('HTTP 404');
  });

  test('a local build reads the snapshot', async () => {
    const { fetch, requests } = fakeFetch(recorded);
    const record = await resolveProposalRecord(entryId, discussion, {
      env: {},
      fetch,
      today,
    });
    expect(requests).toHaveLength(0);
    expect(record.status).toBe('Open, looking for someone to take it');
  });

  test('a local build fails when the snapshot is for another discussion', async () => {
    const other = 'https://github.com/inferogenesis/cpomdp/discussions/1';
    await expect(resolveProposalRecord(entryId, other, { env: {} })).rejects.toThrow(
      other,
    );
  });

  test('a live build without a token fails', async () => {
    await expect(
      resolveProposalRecord(entryId, discussion, { env: { CI: 'true' } }),
    ).rejects.toThrow('GITHUB_TOKEN');
  });
});

test.describe('the form answers a proposal is read from', () => {
  test('a comma inside parentheses stays with its item', () => {
    expect(commaList('One, Two (a, b), Three')).toEqual(['One', 'Two (a, b)', 'Three']);
  });

  test('paragraphs and bullet lists come apart', () => {
    expect(blocks('First line\nwraps.\n\n- one\n- two\n  continues')).toEqual([
      { type: 'paragraph', text: 'First line wraps.' },
      { type: 'list', items: ['one', 'two continues'] },
    ]);
  });

  test('inline markdown becomes code, bold, italics and links, never HTML', () => {
    expect(
      inlineSegments(
        'Set `R(x)`, **bold**, *em*, [doc](https://a.b/c) and <b>H\\*</b>',
      ),
    ).toEqual([
      { type: 'text', text: 'Set ' },
      { type: 'code', text: 'R(x)' },
      { type: 'text', text: ', ' },
      { type: 'strong', text: 'bold' },
      { type: 'text', text: ', ' },
      { type: 'em', text: 'em' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'doc', href: 'https://a.b/c' },
      { type: 'text', text: ' and <b>H*</b>' },
    ]);
  });
});
