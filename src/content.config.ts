import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const support = z.enum(['yes', 'partial', 'no']);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'maintenance', 'archived', 'planned']),
    version: z.string(),
    released: z.coerce.date(),
    licence: z.string(),
    doi: z.string().optional(),
    repo: z.url(),
    docs: z.url(),
    pypi: z.string().optional(),
    python: z.string().optional(),
    install: z.string(),
    authors: z.array(z.string()).min(1),
    snippet: z.object({ source: z.string(), code: z.string() }),
    backends: z.array(z.string()).min(1),
    capabilities: z
      .array(
        z.object({
          feature: z.string(),
          since: z.string(),
          backends: z.record(z.string(), support),
        }),
      )
      .min(1),
  }),
});

export const collections = { projects };
