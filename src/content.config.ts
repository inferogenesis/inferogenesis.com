import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import {
  appliedSchema,
  pageSchema,
  programmeSchema,
  projectSchema,
  proposalSchema,
  researchSchema,
} from './content/schemas';

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

const programmes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/programmes' }),
  schema: programmeSchema,
});

const proposals = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/proposals' }),
  schema: proposalSchema,
});

const applied = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/applied' }),
  schema: appliedSchema,
});

export const collections = {
  projects,
  pages,
  research,
  programmes,
  proposals,
  applied,
};
