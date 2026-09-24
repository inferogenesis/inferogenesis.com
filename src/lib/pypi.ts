import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type PythonRange, pythonRangeSchema } from '../content/schemas';
import { type Env, readsLiveData } from './liveData';
import type { FetchOptions } from './releases';

export type { PythonRange };

interface ResolveOptions extends FetchOptions {
  env?: Env;
}

const utcToday = () => new Date().toISOString().slice(0, 10);

export function readPythonRange(projectId: string): PythonRange {
  const path = join(process.cwd(), 'data', 'pypi', `${projectId}.json`);
  const parsed = pythonRangeSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    throw new Error(`${path} is not a valid PyPI snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function fetchPythonRange(
  pypiPackage: string,
  version: string,
  { fetch = globalThis.fetch, today = utcToday }: FetchOptions = {},
): Promise<PythonRange> {
  const response = await fetch(`https://pypi.org/pypi/${pypiPackage}/${version}/json`);
  if (!response.ok) {
    throw new Error(`PyPI ${pypiPackage} ${version}: HTTP ${response.status}`);
  }
  const { info } = (await response.json()) as {
    info: { version: string; requires_python: string | null };
  };
  return pythonRangeSchema.parse({
    package: pypiPackage,
    version: info.version,
    requiresPython: info.requires_python || null,
    retrieved: today(),
  });
}

export async function resolvePythonRange(
  projectId: string,
  pypiPackage: string,
  version: string,
  { env = process.env, ...options }: ResolveOptions = {},
): Promise<PythonRange> {
  if (readsLiveData(env)) return fetchPythonRange(pypiPackage, version, options);
  const snapshot = readPythonRange(projectId);
  if (snapshot.version !== version) {
    throw new Error(
      `data/pypi/${projectId}.json is for ${snapshot.version}, and the latest release is ${version}.`,
    );
  }
  return snapshot;
}
