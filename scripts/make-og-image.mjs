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
    font-family: Display;
    src: url(${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')});
  }
  @font-face {
    font-family: Body;
    font-weight: 100 900;
    src: url(${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')});
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; padding: 80px 88px;
    display: flex; flex-direction: column; justify-content: space-between;
    background: #f8f7f3; color: #191815; font-family: Body;
  }
  .label { font-size: 22px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: #5f5d57; }
  h1 { font-family: Display; font-weight: 400; font-size: 190px; line-height: 0.95; letter-spacing: -0.02em; margin-left: -8px; }
  .foot { display: flex; justify-content: space-between; align-items: baseline; padding-top: 28px; border-top: 1px solid #dedbd2; font-size: 26px; }
  .foot span:last-child { color: #23513f; font-weight: 500; }
</style>
<p class="label">${field('title')}</p>
<h1>${field('name')}</h1>
<p class="foot"><span>${field('location')}</span><span>cheekane.com</span></p>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL('public/og.png', root)) });
await browser.close();
console.log('Wrote public/og.png');
