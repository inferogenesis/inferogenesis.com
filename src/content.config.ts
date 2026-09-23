import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { projectSchema } from './content/schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: projectSchema,
});

export const collections = { projects };
