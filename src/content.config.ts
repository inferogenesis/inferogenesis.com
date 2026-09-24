import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { pageSchema, projectSchema, researchSchema } from './content/schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: projectSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: pageSchema,
});

const research = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/research' }),
  schema: researchSchema,
});

export const collections = { projects, pages, research };
