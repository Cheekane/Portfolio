// Takes full-page screenshots of the built site at several widths and in
// both themes, for a visual check. Usage:
//   npm run build && npm run preview   (in another terminal)
//   node scripts/shots.mjs <output folder> [base url]
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const out = process.argv[2];
const base = process.argv[3] ?? 'http://localhost:4321';
if (!out) throw new Error('Pass an output folder.');
await mkdir(out, { recursive: true });

const pages = {
  home: '/',
  mealvue: '/work/mealvue/',
  jitto: '/work/jitto/',
  londonkpc: '/work/londonkpc/',
  attendance: '/work/attendance-manager/',
  cell: '/work/cell-growth-simulator/',
  missing: '/404.html',
};
const widths = [320, 375, 768, 1280, 1920];

const browser = await chromium.launch();
for (const colorScheme of ['light', 'dark']) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      colorScheme,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    // The resume preview is a third-party frame, so leave it out of the shots.
    await page.route('https://drive.google.com/**', (route) => route.abort());
    for (const [name, path] of Object.entries(pages)) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 0) console.log(`Horizontal overflow of ${overflow}px: ${name} at ${width}`);
      await page.screenshot({ path: `${out}/${name}-${width}-${colorScheme}.png`, fullPage: true });
    }
    await context.close();
  }
}
await browser.close();
