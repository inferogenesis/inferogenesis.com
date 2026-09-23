import { expect, test } from '@playwright/test';
import {
  pageSchema,
  programmeSchema,
  projectSchema,
  researchSchema,
  writingSchema,
} from '../src/content/schemas';

const research = {
  title: 'State-dependent observation noise reintroduces epistemic value',
  kind: 'preprint',
  authors: ['Corva'],
  published: '2026-07-24',
  arxiv: '2607.20306',
  abstract: 'An abstract.',
};

test.describe('research schema', () => {
  test('accepts a preprint identified by arXiv alone', () => {
    expect(researchSchema.safeParse(research).success).toBe(true);
  });

  test('accepts a DOI with reproduction artefacts', () => {
    const entry = {
      ...research,
      kind: 'dataset',
      arxiv: undefined,
      doi: '10.5281/zenodo.21334562',
      artefacts: [
        { label: 'Figures and scripts', url: 'https://zenodo.org/records/1' },
      ],
    };
    expect(researchSchema.safeParse(entry).success).toBe(true);
  });

  test('rejects an entry with neither a DOI nor an arXiv ID', () => {
    expect(researchSchema.safeParse({ ...research, arxiv: undefined }).success).toBe(
      false,
    );
  });

  test('rejects a malformed DOI', () => {
    expect(
      researchSchema.safeParse({ ...research, doi: 'zenodo.21334562' }).success,
    ).toBe(false);
  });

  test('rejects a malformed arXiv ID', () => {
    expect(
      researchSchema.safeParse({ ...research, arxiv: 'arXiv:2607.20306' }).success,
    ).toBe(false);
  });

  test('rejects an entry without an abstract', () => {
    expect(researchSchema.safeParse({ ...research, abstract: '' }).success).toBe(false);
  });
});

const post = {
  title: 'A post',
  description: 'One line on what it says.',
  published: '2026-10-01',
};

test.describe('writing schema', () => {
  test('accepts a minimal post and defaults tags and draft', () => {
    const parsed = writingSchema.parse(post);
    expect(parsed.tags).toEqual([]);
    expect(parsed.draft).toBe(false);
  });

  test('rejects a post without a description', () => {
    expect(writingSchema.safeParse({ ...post, description: undefined }).success).toBe(
      false,
    );
  });

  test('rejects an update dated before publication', () => {
    expect(writingSchema.safeParse({ ...post, updated: '2026-09-01' }).success).toBe(
      false,
    );
  });
});

const project = {
  name: 'warrantlib',
  description: 'A vocabulary for how well a claim is warranted.',
  status: 'active',
  version: '0.3.0',
  released: '2026-08-26',
  licence: 'MIT',
  repo: 'https://github.com/inferogenesis/cpomdp/tree/main/packages/warrantlib',
  docs: 'https://cpomdp.inferogenesis.com/api/warrant/',
  install: 'pip install warrantlib',
  authors: ['Inferogenesis'],
  snippet: { source: 'a fixture', code: 'import warrantlib' },
  capabilities: [{ feature: 'The vocabulary', since: '0.1.0' }],
};

test.describe('project schema', () => {
  test('accepts a library with no backends and no citation file', () => {
    const parsed = projectSchema.parse(project);
    expect(parsed.backends).toEqual([]);
    expect(parsed.capabilities[0].backends).toEqual({});
    expect(parsed.citationFile).toBeUndefined();
  });

  test('rejects a capability marked for a backend the project does not declare', () => {
    const entry = {
      ...project,
      backends: ['JAX'],
      capabilities: [
        { feature: 'A feature', since: '0.1.0', backends: { RxInfer: 'yes' } },
      ],
    };
    expect(projectSchema.safeParse(entry).success).toBe(false);
  });
});

const gate = {
  cell: 'D3 refinement',
  claim: 'H* is stable under a halved step',
  outcome: 'PASS',
  tier: 'bounded',
  warrant: 'PROVED',
  registered: 'a76cf1b',
  measured: '9baaa22',
};

const programme = {
  title: 'p*',
  question: 'Which claims about active inference can be certified?',
  scope: 'Linear-Gaussian agents with state-dependent noise.',
  status: 'active',
  gates: { asOf: '2026-09-23', rows: [gate] },
};

test.describe('programme schema', () => {
  test('accepts a programme with a dated gates table', () => {
    expect(programmeSchema.safeParse(programme).success).toBe(true);
  });

  test('accepts a planned programme with no gates yet', () => {
    const entry = { ...programme, status: 'planned', gates: undefined };
    expect(programmeSchema.safeParse(entry).success).toBe(true);
  });

  test('rejects a gates table without an as-of date', () => {
    const entry = { ...programme, gates: { rows: [gate] } };
    expect(programmeSchema.safeParse(entry).success).toBe(false);
  });

  test('rejects an outcome outside PASS, FAIL, VOID and pending', () => {
    const entry = {
      ...programme,
      gates: { asOf: '2026-09-23', rows: [{ ...gate, outcome: 'FIRED' }] },
    };
    expect(programmeSchema.safeParse(entry).success).toBe(false);
  });

  test('rejects a PASS that carries no warrant', () => {
    const row = { ...gate, warrant: undefined };
    const entry = { ...programme, gates: { asOf: '2026-09-23', rows: [row] } };
    expect(programmeSchema.safeParse(entry).success).toBe(false);
  });

  test('rejects a pending gate that claims a warrant or a measurement', () => {
    const row = { ...gate, outcome: 'pending' };
    const entry = { ...programme, gates: { asOf: '2026-09-23', rows: [row] } };
    expect(programmeSchema.safeParse(entry).success).toBe(false);
  });

  test('accepts a pending gate with only its registration', () => {
    const row = {
      ...gate,
      outcome: 'pending',
      warrant: undefined,
      measured: undefined,
    };
    const entry = { ...programme, gates: { asOf: '2026-09-23', rows: [row] } };
    expect(programmeSchema.safeParse(entry).success).toBe(true);
  });

  test('rejects a VOID that claims a warrant', () => {
    const row = { ...gate, outcome: 'VOID', qualifier: 'budget' };
    const entry = { ...programme, gates: { asOf: '2026-09-23', rows: [row] } };
    expect(programmeSchema.safeParse(entry).success).toBe(false);
  });

  test('rejects a registration that is a branch name rather than a fixed ref', () => {
    const row = { ...gate, registered: 'main' };
    const entry = { ...programme, gates: { asOf: '2026-09-23', rows: [row] } };
    expect(programmeSchema.safeParse(entry).success).toBe(false);
  });
});

test.describe('page schema', () => {
  test('accepts a page with a title and a description', () => {
    expect(
      pageSchema.safeParse({ title: 'About', description: 'Who and how.' }).success,
    ).toBe(true);
  });

  test('rejects a page without a description', () => {
    expect(pageSchema.safeParse({ title: 'About' }).success).toBe(false);
  });
});
