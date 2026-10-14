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
// A research entry names its DOI and the artefacts that reproduce it. Everything DataCite
// holds comes from DataCite. Strict, so a typed title or abstract fails the build.
export const researchSchema = z
  .object({
    doi,
    artefacts: z
      .array(z.object({ label: z.string(), url: z.url(), doi: doi.optional() }))
      .default([]),
  })
  .strict();

export const researchRecordSchema = z.object({
  doi,
  title: z.string().min(1),
  kind: z.enum(['paper', 'preprint', 'dataset']),
  authors: z.array(z.string()).min(1),
  published: z.iso.date(),
  publisher: z.string(),
  abstract: z.string().min(1),
  // The abstract is quoted, so its terms and their source are required.
  licence: z.object({ name: z.string(), url: z.url() }),
  retrieved: z.iso.date(),
});

export type ResearchRecord = z.infer<typeof researchRecordSchema>;

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

const tier = z.enum(['exact', 'bounded', 'computed']);

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
    // A registered cell can span two tiers, as the ledger writes EXACT/BOUNDED.
    tier: z.union([tier, z.array(tier).min(2)]),
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

// A registered target or prediction, named by the ID that traces it to its check.
const targetId = z
  .string()
  .regex(/^(G|T)\d+$|^BN-\d+[a-z]$/, 'an ID such as G4, T10 or BN-3b');
const literatureId = z.string().regex(/^L\d+$/, 'an L item such as L12');

// [[term]] or [[term|shown text]] marks a term in running text. The page shows its
// definition on hover and lists every definition under Terms.
export const termMarkup = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const markedTerms = (text: string) =>
  [...text.matchAll(termMarkup)].map((match) => match[1].trim());
// [label](href) links from running text, to a page on this site or an https address.
export const linkMarkup = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const linkTargets = (text: string) =>
  [...text.replaceAll(termMarkup, '').matchAll(linkMarkup)].map((match) => match[2]);

const ladderWorld = z
  .object({
    drawing: z.enum([
      'gradient',
      'well-mixed',
      'diffusion-2d',
      'direct-channel',
      'nested',
      'superposed',
    ]),
    label: z.string().min(1),
    objects: z.array(z.string()).min(1),
    act: z.string().min(1),
    read: z.string().min(1),
    targets: z.array(targetId).default([]),
  })
  .strict();

const rung = z
  .object({
    rung: z.number().int().min(0),
    name: z.string().min(1),
    // Read aloud in place of the drawing, and shown when the drawing cannot be.
    summary: z.string().min(1),
    // The part of a rung that ships, with the file at the release that shows it.
    exists: z
      .object({
        what: z.string().min(1),
        release: z.string().regex(/^v\d+\.\d+\.\d+$/, 'a version tag such as v0.4.0'),
        url: z.url(),
      })
      .strict()
      .optional(),
    gates: z.array(targetId).default([]),
    literature: literatureId.optional(),
    agent: z.string().min(1),
    reader: z.string().min(1),
    readerNote: z.string().optional(),
    // The reader is the actor itself, drawn as a dashed card.
    readerIsActor: z.boolean().default(false),
    worlds: z.array(ladderWorld).min(1),
  })
  .strict();

export const programmeSchema = z
  .object({
    title: z.string(),
    question: z.string(),
    scope: z.string(),
    status: z.enum(['active', 'planned', 'closed']),
    // Commit refs in the gates table resolve against this repository.
    repository: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, 'owner/name')
      .optional(),
    // Rendered to MathML at build time, directly under the scope.
    equation: z.object({ tex: z.string().min(1), label: z.string().min(1) }).optional(),
    // A drawn figure in the same place, for a programme whose claim is a structure.
    figure: z.enum(['seam-join']).optional(),
    // Opens the page, before the question, for what the reader has to know first.
    premise: z
      .object({ title: z.string().min(1), text: z.string().min(1) })
      .strict()
      .optional(),
    // The layout states warrantlib's own rules, so no other project fits this field yet.
    certifiedWith: z.literal('warrantlib').optional(),
    papers: z.array(z.string()).default([]),
    gates: z.object({ asOf: z.coerce.date(), rows: z.array(gate).min(1) }).optional(),
    // Cells checked at a release and never pre-registered. They sit apart from the gates.
    verified: z
      .array(
        z.object({
          cell: z.string(),
          claim: z.string(),
          tier,
          release: z.string().regex(/^v\d+\.\d+\.\d+$/, 'a version tag such as v0.4.3'),
          check: ref.optional(),
        }),
      )
      .default([]),
    ladder: z.array(rung).default([]),
    targets: z
      .array(z.object({ id: targetId, claim: z.string().min(1) }).strict())
      .default([]),
    literature: z
      .array(
        z
          .object({
            id: literatureId,
            status: z.enum(['open', 'closed']),
            source: z.string().optional(),
          })
          .strict(),
      )
      .default([]),
    terms: z
      .array(
        z.object({ term: z.string().min(1), definition: z.string().min(1) }).strict(),
      )
      .default([]),
  })
  .strict()
  .refine((programme) => !programme.gates || programme.repository, {
    message: 'A gates table needs the repository its commit refs belong to.',
    path: ['repository'],
  })
  .refine((programme) => !(programme.equation && programme.figure), {
    message: 'A programme leads with one flagship, an equation or a figure.',
    path: ['figure'],
  })
  .refine(
    (programme) =>
      new Set(programme.targets.map((target) => target.id)).size ===
      programme.targets.length,
    { message: 'Each target ID has one line.', path: ['targets'] },
  )
  .refine(
    (programme) => {
      const lines = new Set(programme.targets.map((target) => target.id));
      return programme.ladder.every((step) =>
        [...step.gates, ...step.worlds.flatMap((world) => world.targets)].every((id) =>
          lines.has(id),
        ),
      );
    },
    { message: 'Every target a rung names needs its line.', path: ['targets'] },
  )
  .refine(
    (programme) => {
      const items = new Set(programme.literature.map((item) => item.id));
      return programme.ladder.every(
        (step) => !step.literature || items.has(step.literature),
      );
    },
    { message: 'Every literature badge needs its L item.', path: ['literature'] },
  )
  .refine(
    (programme) =>
      programme.literature.every((item) => item.status === 'open' || item.source),
    { message: 'A closed L item names its source.', path: ['literature'] },
  )
  .refine(
    (programme) =>
      programme.ladder.every(
        (step, index) => index === 0 || programme.ladder[index - 1].rung < step.rung,
      ),
    { message: 'Rungs are listed in order.', path: ['ladder'] },
  )
  .refine(
    (programme) =>
      new Set(programme.terms.map((entry) => entry.term)).size ===
      programme.terms.length,
    { message: 'Each term has one definition.', path: ['terms'] },
  )
  .refine(
    (programme) =>
      markedTerms(programme.question).length === 0 &&
      linkTargets(programme.question).length === 0,
    {
      message:
        'The question leaves the page as plain text, so it marks no terms or links.',
      path: ['question'],
    },
  )
  .refine(
    (programme) =>
      [programme.premise?.text ?? '', programme.scope]
        .flatMap(linkTargets)
        .every((href) => href.startsWith('https://') || /^\/(?!\/)/.test(href)),
    {
      message: 'A link goes to a page on this site or an https address.',
      path: ['premise'],
    },
  )
  .refine(
    (programme) => {
      const defined = new Set(programme.terms.map((entry) => entry.term));
      const texts = [
        programme.premise?.text ?? '',
        programme.scope,
        ...programme.ladder.flatMap((step) => [step.summary, step.readerNote ?? '']),
        ...programme.targets.map((target) => target.claim),
      ];
      return texts.flatMap(markedTerms).every((term) => defined.has(term));
    },
    { message: 'Every marked term needs its definition.', path: ['terms'] },
  );

export type Gate = z.infer<typeof gate>;
export type Programme = z.infer<typeof programmeSchema>;
export type VerifiedCell = Programme['verified'][number];
export type Rung = Programme['ladder'][number];
export type LadderWorld = Rung['worlds'][number];
export type Target = Programme['targets'][number];
export type LiteratureItem = Programme['literature'][number];
export type Term = Programme['terms'][number];

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

const newestFirst = (entries: { published: string }[]) =>
  entries.every(
    (entry, index) => index === 0 || entries[index - 1].published >= entry.published,
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

const linkedPost = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    published: z.iso.date(),
    updated: z.iso.date().optional(),
    url: z.url(),
  })
  .refine((post) => !post.updated || post.updated >= post.published, {
    message: 'An update cannot predate publication.',
    path: ['updated'],
  });

// Posts that stay where they were first published and are linked from the writing list.
export const backCatalogueSchema = z
  .object({
    feed: z.url(),
    retrieved: z.iso.date(),
    posts: z.array(linkedPost).min(1),
  })
  .refine((catalogue) => newestFirst(catalogue.posts), {
    message: 'Posts are listed newest first.',
    path: ['posts'],
  });

export type BackCatalogue = z.infer<typeof backCatalogueSchema>;
export type LinkedPost = BackCatalogue['posts'][number];
