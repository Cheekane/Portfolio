import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { inListOrder } from './order';
import type { Detail, Experience, Project } from '../content/schema';

export async function getExperience(): Promise<Experience[]> {
  return inListOrder((await getCollection('experience')).map((entry) => entry.data));
}

export async function getProjects(): Promise<Project[]> {
  return inListOrder((await getCollection('projects')).map((entry) => entry.data));
}

/** The shape a detail page needs, whether it is a job or a project. */
export interface DetailPage {
  id: string;
  kind: 'Experience' | 'Project';
  title: string;
  subtitle: string;
  period: string;
  description: string;
  detail: Detail;
}

export function workPath(id: string): string {
  return `/work/${id}/`;
}

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/work/*', { eager: true });

/** Looks up an image in src/assets/work by file name. Fails the build if it is missing. */
export function workImage(file: string): ImageMetadata {
  const found = images[`../assets/work/${file}`];
  if (!found) throw new Error(`Missing image: src/assets/work/${file}`);
  return found.default;
}
