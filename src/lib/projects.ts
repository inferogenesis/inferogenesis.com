import { getCollection } from 'astro:content';

export async function listProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.name.localeCompare(b.data.name));
}
