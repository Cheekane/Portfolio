import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Every test blocks the Google Drive resume preview. It is a third-party
 * page, so loading it would make the suite slow and depend on the network.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://drive.google.com/**', (route) => route.abort());
    await use(page);
  },
});

export { expect };

interface Entry {
  id: string;
  company?: string;
  name?: string;
  detail?: unknown;
}

const readList = (path: string) => parse(readFileSync(path, 'utf8')) as Entry[];

export const experience = readList('src/content/experience.yaml');
export const projects = readList('src/content/projects.yaml');

/** Every job or project that has a detail page, as { id, title }. */
export const detailPages = [...experience.filter((entry) => entry.detail), ...projects].map(
  (entry) => ({ id: entry.id, title: entry.company ?? entry.name ?? entry.id }),
);
