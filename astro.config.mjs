// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://inferogenesis.com',
  trailingSlash: 'always',
  integrations: [mdx(), pagefind()],
});
