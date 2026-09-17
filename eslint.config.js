import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/', '.astro/', 'node_modules/', '.claude/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],
  { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
]);
