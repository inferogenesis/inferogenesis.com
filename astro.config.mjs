// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Serves the current tokens at /tokens.css beside the frozen copies under /tokens/.
 * @returns {import('astro').AstroIntegration}
 */
function tokens() {
  return {
    name: 'tokens',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await copyFile(
          'src/styles/tokens.css',
          fileURLToPath(new URL('tokens.css', dir)),
        );
      },
    },
  };
}

export default defineConfig({
  site: 'https://inferogenesis.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/kitchen-sink/') }),
    pagefind(),
    tokens(),
  ],
});
