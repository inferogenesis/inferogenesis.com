import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/', '.astro/', 'node_modules/', '.claude/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],
  { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  {
    rules: {
      // A labelled region that scrolls must be focusable to be scrolled by keyboard.
      'astro/jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'] },
      ],
    },
  },
  {
    files: ['astro.config.mjs', 'scripts/**/*.mjs', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },
]);
