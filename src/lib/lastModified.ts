import { execSync } from 'node:child_process';

export function lastModified(filePath: string): Date | undefined {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf8',
    }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}
