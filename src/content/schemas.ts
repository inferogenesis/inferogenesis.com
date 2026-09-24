import { z } from 'astro/zod';

const support = z.enum(['yes', 'partial', 'no']);

export const projectSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'maintenance', 'archived', 'planned']),
    licence: z.string(),
    doi: z.string().optional(),
    repo: z.url(),
    docs: z.url(),
    // The URL is built from the latest release tag, so it never names a stale version.
    hasCitationFile: z.boolean().default(false),
    pypi: z.string().optional(),
    install: z.string(),
    authors: z.array(z.string()).min(1),
    snippet: z.object({ source: z.string(), code: z.string() }),
    backends: z.array(z.string()).default([]),
    capabilities: z
      .array(
        z.object({
          feature: z.string(),
          since: z.string(),
          backends: z.record(z.string(), support).default({}),
        }),
      )
      .min(1),
  })
  // Version and release date come from the release data. Strict, so typing either fails.
  .strict()
  .refine(
    (project) =>
      project.capabilities.every((row) =>
        Object.keys(row.backends).every((backend) =>
          project.backends.includes(backend),
        ),
      ),
    {
      message: 'A capability names a backend the project does not declare.',
      path: ['capabilities'],
    },
  );

const doi = z
  .string()
  .regex(/^10\.\d{4,9}\/\S+$/, 'a bare DOI such as 10.5281/zenodo.1');
const arxivId = z
  .string()
  .regex(/^\d{4}\.\d{4,5}(v\d+)?$/, 'a bare arXiv ID such as 2607.20306');

export const researchSchema = z
  .object({
    title: z.string(),
    kind: z.enum(['paper', 'preprint', 'dataset']),
    authors: z.array(z.string()).min(1),
    published: z.coerce.date(),
    doi: doi.optional(),
    arxiv: arxivId.optional(),
    venue: z.string().optional(),
    abstract: z.string().min(1),
    // Terms for the abstract and any quoted material, which belong to the authors.
    licence: z.string().optional(),
    artefacts: z
      .array(z.object({ label: z.string(), url: z.url(), doi: doi.optional() }))
      .default([]),
  })
  .refine((entry) => entry.doi || entry.arxiv, {
    message: 'A research entry needs a DOI or an arXiv ID.',
    path: ['doi'],
  });

export const writingSchema = z
  .object({
    title: z.string(),
    description: z.string().min(1),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  })
  .refine((post) => !post.updated || post.updated >= post.published, {
    message: 'An update cannot predate publication.',
    path: ['updated'],
  });

// Fixed refs only, as warrantlib's Provenance takes them: a commit SHA, a URL or a DOI.
const ref = z
  .string()
  .regex(
    /^([0-9a-f]{7,40}|https?:\/\/\S+|10\.\d{4,9}\/\S+)$/,
    'a commit SHA, a URL or a DOI',
  );

const gate = z
  .object({
    cell: z.string(),
    claim: z.string(),
    outcome: z.enum(['PASS', 'FAIL', 'VOID', 'pending']),
    // A VOID says why it went unmeasured, as the ledger writes "VOID (budget)".
    qualifier: z.string().optional(),
    tier: z.enum(['exact', 'bounded', 'computed']),
    warrant: z.enum(['PROVED', 'CERTIFIED', 'CORROBORATED']).optional(),
    registered: ref,
    measured: ref.optional(),
  })
  .refine(
    (row) =>
      (row.outcome === 'PASS' || row.outcome === 'FAIL') === Boolean(row.warrant),
    {
      message: 'PASS and FAIL carry a warrant. VOID and pending carry none.',
      path: ['warrant'],
    },
  )
  .refine((row) => row.outcome !== 'pending' || !row.measured, {
    message: 'A pending gate has not been measured.',
    path: ['measured'],
  });

export const programmeSchema = z.object({
  title: z.string(),
  question: z.string(),
  scope: z.string(),
  status: z.enum(['active', 'planned', 'closed']),
  papers: z.array(z.string()).default([]),
  gates: z.object({ asOf: z.coerce.date(), rows: z.array(gate).min(1) }).optional(),
});

export const pageSchema = z.object({
  title: z.string(),
  description: z.string().min(1),
});

const release = z.object({
  version: z.string(),
  releaseTag: z.string().optional(),
  published: z.iso.date(),
  url: z.url(),
});

const newestFirst = (releases: { published: string }[]) =>
  releases.every(
    (entry, index) => index === 0 || releases[index - 1].published >= entry.published,
  );

// Where a project's release list came from, and when it was read. A GitHub release always
// has its tag. A PyPI-only project, such as warrantlib today, lists versions.
export const releaseSnapshotSchema = z
  .discriminatedUnion('source', [
    z.object({
      source: z.literal('github-releases'),
      repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'owner/name'),
      retrieved: z.iso.date(),
      releases: z.array(release.extend({ releaseTag: z.string() })).min(1),
    }),
    z.object({
      source: z.literal('pypi'),
      package: z.string(),
      retrieved: z.iso.date(),
      releases: z.array(release).min(1),
    }),
  ])
  .refine((snapshot) => newestFirst(snapshot.releases), {
    message: 'Releases are listed newest first.',
    path: ['releases'],
  });

export type ReleaseSnapshot = z.infer<typeof releaseSnapshotSchema>;
export type Release = ReleaseSnapshot['releases'][number];

// The Python range PyPI declares for one released version.
export const pythonRangeSchema = z.object({
  package: z.string(),
  version: z.string(),
  requiresPython: z.string().nullable(),
  retrieved: z.iso.date(),
});

export type PythonRange = z.infer<typeof pythonRangeSchema>;
