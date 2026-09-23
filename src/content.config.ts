import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { pageSchema, projectSchema } from './content/schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: projectSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: pageSchema,
});

export const collections = { projects, pages };
