import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { experienceSchema, projectSchema } from './content/schema';
import { parseOrderedList } from './content/parse';

const experience = defineCollection({
  loader: file('src/content/experience.yaml', { parser: parseOrderedList }),
  schema: experienceSchema,
});

const projects = defineCollection({
  loader: file('src/content/projects.yaml', { parser: parseOrderedList }),
  schema: projectSchema,
});

export const collections = { experience, projects };
