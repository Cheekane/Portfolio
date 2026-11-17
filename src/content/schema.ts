import { z } from 'astro/zod';

/** A month written as YYYY-MM, for example 2026-09. */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');

const link = z.object({
  label: z.string(),
  // Leave href out while the real link is not known yet. The slot is then
  // hidden on the live site and shown as a marked TODO in `npm run dev`.
  href: z.url().optional(),
  kind: z.enum(['live', 'code', 'store']),
  note: z.string().optional(),
});

const image = z.object({
  // File name inside src/assets/work.
  file: z.string(),
  alt: z.string().min(10),
  caption: z.string().optional(),
});

const result = z.object({
  // The headline figure, for example "81%".
  value: z.string(),
  label: z.string(),
});

const stackGroup = z.object({
  label: z.string(),
  items: z.array(z.string()).min(1),
});

export const caseStudySchema = z.object({
  // One or two sentences shown under the page title.
  intro: z.string(),
  // Short facts shown beside the intro (team, reach, status).
  facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  problem: z.array(z.string()).min(1),
  built: z.array(z.string()).min(1),
  stack: z.array(stackGroup).min(1),
  results: z.array(result).default([]),
  outcomes: z.array(z.string()).default([]),
  links: z.array(link).default([]),
  images: z.array(image).default([]),
  // Marked image slots that still need a real file.
  imageTodos: z.array(z.string()).default([]),
  // Name of an interactive demo to mount on the page.
  demo: z.enum(['cell-growth']).optional(),
});

export const experienceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  // Position in the list in experience.yaml. Set by the loader, not by hand.
  order: z.number().int().nonnegative(),
  company: z.string(),
  // Leave out for jobs that only need one line.
  role: z.string().optional(),
  start: yearMonth,
  // Leave out for a current role.
  end: yearMonth.optional(),
  location: z.string().optional(),
  // One line used in lists and in the lead feature.
  summary: z.string().optional(),
  caseStudy: caseStudySchema.optional(),
});

export const projectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int().nonnegative(),
  name: z.string(),
  years: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).min(1),
  cover: image,
  caseStudy: caseStudySchema,
});

export type CaseStudy = z.infer<typeof caseStudySchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type WorkLink = z.infer<typeof link>;
export type WorkImage = z.infer<typeof image>;
