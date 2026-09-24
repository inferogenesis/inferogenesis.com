import { expect, test } from '@playwright/test';
import {
  pageSchema,
  programmeSchema,
  projectSchema,
  researchRecordSchema,
  researchSchema,
  writingSchema,
} from '../src/content/schemas';

const research = {
  doi: '10.48550/arXiv.2607.20306',
  artefacts: [
    { label: 'cpomdp v0.4.2', url: 'https://doi.org/10.5281/zenodo.21429863' },
  ],
};

test.describe('research entry schema', () => {
  test('accepts a DOI with its reproduction artefacts', () => {
    expect(researchSchema.safeParse(research).success).toBe(true);
  });

  test('accepts a DOI alone and defaults to no artefacts', () => {
    expect(researchSchema.parse({ doi: research.doi }).artefacts).toEqual([]);
  });

  test('rejects an entry without a DOI', () => {
    expect(researchSchema.safeParse({ artefacts: [] }).success).toBe(false);
  });

  test('rejects a malformed DOI', () => {
    expect(
      researchSchema.safeParse({ ...research, doi: 'zenodo.21334562' }).success,
    ).toBe(false);
  });

  for (const field of [
    'title',
    'authors',
    'published',
    'abstract',
    'licence',
    'kind',
    'arxiv',
  ]) {
    test(`rejects a typed ${field}, which comes from DataCite`, () => {
      expect(researchSchema.safeParse({ ...research, [field]: 'typed' }).success).toBe(
        false,
      );
    });
  }
});

const record = {
  doi: '10.48550/arXiv.2607.20306',
  title: 'State-Dependent Observation Noise Reintroduces Epistemic Value',
  kind: 'preprint',
  authors: ['Daniel Corva'],
  published: '2026-07-22',
  publisher: 'arXiv',
  abstract: 'An abstract.',
  licence: {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/legalcode',
  },
  retrieved: '2026-09-24',
};

test.describe('research record schema', () => {
  test('accepts a complete DataCite record', () => {
    expect(researchRecordSchema.safeParse(record).success).toBe(true);
  });

  test('rejects a record that quotes an abstract without its licence', () => {
    expect(
      researchRecordSchema.safeParse({ ...record, licence: undefined }).success,
    ).toBe(false);
  });

  test('rejects licence terms without a link to them', () => {
    const entry = { ...record, licence: { name: 'CC BY 4.0' } };
    expect(researchRecordSchema.safeParse(entry).success).toBe(false);
  });

  test('rejects a record without an abstract', () => {
    expect(researchRecordSchema.safeParse({ ...record, abstract: '' }).success).toBe(
      false,
    );
  });

  test('rejects a date that is not ISO 8601', () => {
    expect(
      researchRecordSchema.safeParse({ ...record, published: '2026-07' }).success,
    ).toBe(false);
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
  licence: 'MIT',
  repo: 'https://github.com/inferogenesis/cpomdp/tree/main/packages/warrantlib',
  docs: 'https://cpomdp.inferogenesis.com/api/warrant/',
  pypi: 'warrantlib',
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
    expect(parsed.hasCitationFile).toBe(false);
  });

  for (const [field, value] of [
    ['version', '0.3.0'],
    ['released', '2026-08-26'],
    ['python', '>=3.11'],
  ]) {
    test(`rejects a project that types its own ${field}, which comes from its release data`, () => {
      const entry = { ...project, [field]: value };
      expect(projectSchema.safeParse(entry).success).toBe(false);
    });
  }

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
