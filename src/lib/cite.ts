export interface Citable {
  name: string;
  version: string;
  released: Date;
  authors: string[];
  repo: string;
  doi?: string;
}

export function bibtex(project: Citable): string {
  const year = project.released.getUTCFullYear();
  const lines = [
    `@software{${project.name}${year},`,
    `  author  = {${project.authors.join(' and ')}},`,
    `  title   = {${project.name}},`,
    `  version = {${project.version}},`,
    `  year    = {${year}},`,
  ];
  if (project.doi) lines.push(`  doi     = {${project.doi}},`);
  lines.push(`  url     = {${project.repo}}`, '}');
  return lines.join('\n');
}
