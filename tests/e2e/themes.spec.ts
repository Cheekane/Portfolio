import AxeBuilder from '@axe-core/playwright';
import { caseStudies, expect, test } from './fixtures';

const themes = [
  { colorScheme: 'light', background: 'rgb(250, 250, 250)' },
  { colorScheme: 'dark', background: 'rgb(9, 9, 11)' },
] as const;

const paths = ['/', ...caseStudies.map((study) => `/work/${study.id}/`), '/404.html'];

for (const theme of themes) {
  test.describe(`${theme.colorScheme} theme`, () => {
    test.use({ colorScheme: theme.colorScheme });

    test('follows the system colour scheme', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('body')).toHaveCSS('background-color', theme.background);
    });

    for (const path of paths) {
      test(`has no accessibility violations on ${path}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          // The resume preview is Google's page, not ours.
          .exclude('iframe')
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('nothing overflows sideways on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBe(0);
  }
});

test('motion is switched off for people who ask for less of it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCSS('animation-name', 'none');
});
