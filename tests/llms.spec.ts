import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readBackCatalogue } from '../src/lib/backCatalogue';

test.describe('llms.txt', () => {
  let text = '';
  test.beforeAll(async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    text = await response.text();
  });

  test('opens with the name and the fixed tagline', () => {
    expect(text.startsWith('# Inferogenesis\n')).toBe(true);
    expect(text).toContain('> continuous active inference, from the first cell');
  });

  test('lists each project with its docs, version and DOI', () => {
    expect(text).toMatch(
      /- \[cpomdp\]\(https:\/\/inferogenesis\.com\/projects\/cpomdp\/\): /,
    );
    expect(text).toContain('https://cpomdp.inferogenesis.com/');
    expect(text).toContain('DOI 10.5281/zenodo.21334562');
    expect(text).toMatch(/cpomdp.*version \d+\.\d+\.\d+/);
    expect(text).toMatch(
      /- \[warrantlib\]\(https:\/\/inferogenesis\.com\/projects\/warrantlib\/\): /,
    );
  });

  test('lists the research by DOI and the programmes by question', () => {
    expect(text).toContain('DOI 10.48550/arXiv.2607.20306');
    expect(text).toContain('Daniel Corva');
    expect(text).toMatch(
      /- \[p\*: certifiable active inference\]\(https:\/\/inferogenesis\.com\/programmes\/p-star\/\): /,
    );
  });

  test('lists each post under Writing, linked where it lives, before Optional', () => {
    const writing = text.indexOf('\n## Writing\n');
    const optional = text.indexOf('\n## Optional\n');
    expect(writing).toBeGreaterThan(-1);
    expect(writing).toBeLessThan(optional);
    const section = text.slice(writing, optional);
    for (const post of readBackCatalogue().posts) {
      expect(section).toContain(`- [${post.title}](${post.url}): `);
      expect(section).toContain(`Published ${post.published}`);
    }
  });

  test('every link to this site resolves to a built page', () => {
    const links = [...text.matchAll(/\(https:\/\/inferogenesis\.com(\/[^)]*)\)/g)].map(
      (m) => m[1],
    );
    expect(links.length).toBeGreaterThan(3);
    for (const path of links) {
      const file = path.endsWith('/')
        ? join('dist', path, 'index.html')
        : join('dist', path);
      expect(existsSync(file), path).toBe(true);
    }
  });
});
