// Draws public/og.png, the 1200 x 630 card shown when the site is shared.
// Run it with `npm run og` after changing the name, title or location.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const font = (path) =>
  `data:font/woff2;base64,${readFileSync(new URL(`node_modules/${path}`, root)).toString('base64')}`;

// Read the facts from the same file the site uses, so they cannot drift apart.
const source = readFileSync(new URL('src/data/profile.ts', root), 'utf8');
const field = (name) => {
  const match = new RegExp(`${name}: '([^']+)'`).exec(source);
  if (!match) throw new Error(`Could not find ${name} in src/data/profile.ts`);
  return match[1];
};

const html = `<!doctype html>
<style>
  @font-face {
    font-family: Inter;
    font-weight: 100 900;
    src: url(${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')});
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; padding: 80px 88px;
    display: flex; flex-direction: column; justify-content: space-between;
    background: #fafafa; color: #18181b; font-family: Inter;
  }
  .eyebrow { font-size: 28px; font-weight: 600; color: #0f766e; }
  h1 { font-weight: 700; font-size: 148px; line-height: 1; letter-spacing: -0.045em; margin-left: -6px; }
  .foot { display: flex; justify-content: space-between; align-items: baseline; padding-top: 28px; border-top: 1px solid #e4e4e7; font-size: 26px; color: #52525b; }
  .foot span:last-child { color: #18181b; font-weight: 600; }
</style>
<p class="eyebrow">${field('title')}</p>
<h1>${field('name')}</h1>
<p class="foot"><span>${field('location')}</span><span>cheekane.com</span></p>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL('public/og.png', root)) });
await browser.close();
console.log('Wrote public/og.png');
