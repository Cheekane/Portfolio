import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { parseOrderedList } from '@/content/parse';
import { experienceSchema, projectSchema } from '@/content/schema';
import { leadOf } from '@/lib/order';

const read = (path: string) => readFileSync(path, 'utf8');
const experience = z
  .array(experienceSchema)
  .parse(parseOrderedList(read('src/content/experience.yaml')));
const projects = z.array(projectSchema).parse(parseOrderedList(read('src/content/projects.yaml')));

/** Every text file that ends up on the site or in the repo history. */
function textFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return textFiles(path);
    return /\.(astro|ts|tsx|css|yaml|yml|md|mjs|js|json|sh|txt|svg)$/.test(name) ? [path] : [];
  });
}

describe('content files', () => {
  it('match the schema', () => {
    expect(experience.length).toBeGreaterThan(0);
    expect(projects.map((project) => project.id)).toEqual([
      'shelfie',
      'londonkpc',
      'attendance-manager',
      'cell-growth-simulator',
    ]);
  });

  it('use each id once, because ids become page addresses', () => {
    const ids = [...experience, ...projects].map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lead with the first experience entry in the file', () => {
    const firstInFile = /^- id: (\S+)/m.exec(read('src/content/experience.yaml'))?.[1];
    expect(leadOf(experience)?.id).toBe(firstInFile);
  });

  it('point at images that exist', () => {
    const files = [
      ...projects.map((project) => project.cover.file),
      ...[...experience, ...projects].flatMap(
        (entry) => entry.detail?.images.map((image) => image.file) ?? [],
      ),
    ];
    for (const file of files) {
      expect(existsSync(join('src/assets/work', file)), file).toBe(true);
    }
  });
});

describe('writing rules', () => {
  const files = [
    ...textFiles('src'),
    ...textFiles('tests').filter((path) => !path.endsWith('content.test.ts')),
    ...textFiles('scripts'),
    ...textFiles('.github'),
    'README.md',
    'portfolio.yaml',
    'deploy_content.sh',
    'deploy_stack.sh',
  ];

  it('never use an em dash', () => {
    for (const file of files) {
      expect(read(file).includes('—'), file).toBe(false);
    }
  });

  it('never use the word junior', () => {
    for (const file of files) {
      expect(/\bjunior\b/i.test(read(file)), file).toBe(false);
    }
  });
});
