import { detailPages, expect, test } from './fixtures';

test('home page shows who Brian is and how to reach him', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Brian Park | Full Stack Software Engineer');
  await expect(page.getByRole('heading', { level: 1, name: 'Brian Park' })).toBeVisible();

  const hero = page.locator('.hero');
  await expect(hero).toContainText('Full Stack Software Engineer');
  await expect(hero).toContainText('London, Ontario, Canada');
  await expect(hero.getByRole('link', { name: 'brianpark1101@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:brianpark1101@gmail.com',
  );
  await expect(hero.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    'https://linkedin.com/in/brianpark1101',
  );
  await expect(hero.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/cheekane',
  );
});

test('home page has every section', async ({ page }) => {
  await page.goto('/');
  for (const id of [
    'experience',
    'projects',
    'skills',
    'education',
    'about',
    'resume',
    'contact',
  ]) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }
});

test('the header links jump to sections', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator('#about')).toBeInViewport();
});

test('the resume links to Google Drive and embeds its live preview', async ({ page }) => {
  await page.goto('/');
  const resume = page.locator('#resume');
  await expect(resume.getByRole('link', { name: /Open the resume/ })).toHaveAttribute(
    'href',
    'https://drive.google.com/file/d/1EzBz2eaRIJkU6yn8wHhpW0dpXrON6LP3/view',
  );
  await expect(resume.locator('iframe')).toHaveAttribute(
    'src',
    'https://drive.google.com/file/d/1EzBz2eaRIJkU6yn8wHhpW0dpXrON6LP3/preview',
  );
});

for (const study of detailPages) {
  test(`detail page: ${study.id}`, async ({ page }) => {
    await page.goto(`/work/${study.id}/`);
    await expect(page.getByRole('heading', { level: 1, name: study.title })).toBeVisible();
    for (const heading of ['The problem', 'What I built', 'Stack']) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://cheekane.com/work/${study.id}/`,
    );
  });
}

test('a project card opens its detail page, and the back link returns home', async ({ page }) => {
  await page.goto('/');
  await page
    .getByTestId('project-list')
    .getByRole('link', { name: 'LondonKPC church website', exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/londonkpc\/$/);
  await expect(page.getByTestId('detail-links').getByRole('link')).toHaveAttribute(
    'href',
    'https://londonkpcem.ca',
  );
  await page.getByRole('link', { name: 'All work' }).click();
  await expect(page).toHaveURL(/\/#projects$/);
});

test('the next link walks through every detail page and loops back', async ({ page }) => {
  await page.goto(`/work/${detailPages[0]!.id}/`);
  for (const study of [...detailPages.slice(1), detailPages[0]!]) {
    await page.getByRole('navigation', { name: 'More work' }).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: study.title })).toBeVisible();
  }
});

test('unfinished TODO slots never reach the built site', async ({ page }) => {
  for (const study of detailPages) {
    await page.goto(`/work/${study.id}/`);
    await expect(page.locator('.todo-slot')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('TODO');
  }
});

test('no built page uses the phrase "case study"', async ({ page }) => {
  const paths = ['/', ...detailPages.map((study) => `/work/${study.id}/`), '/404.html'];
  for (const path of paths) {
    await page.goto(path);
    // The full HTML, so titles, descriptions, alt text and labels are covered too.
    expect(await page.content(), path).not.toMatch(/case[\s-]*stud(y|ies)/i);
  }
});

test('the contact section shows the three ways to reach Brian', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link')).toHaveCount(3);
  await expect(contact.getByRole('link', { name: 'brianpark1101@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:brianpark1101@gmail.com',
  );
  await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    'https://linkedin.com/in/brianpark1101',
  );
  await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/cheekane',
  );
  await expect(contact.locator('p')).toHaveCount(0);
});

test('an unknown address shows the 404 page', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist.');
  await page.getByRole('link', { name: 'Back to the home page' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Brian Park' })).toBeVisible();
});

test('pages ship no JavaScript, except the demo page', async ({ page }) => {
  const scripts = () => page.locator('script:not([type="application/ld+json"])').count();
  for (const path of ['/', '/work/mealvue/', '/work/londonkpc/', '/404.html']) {
    await page.goto(path);
    expect(await scripts(), path).toBe(0);
    await expect(page.locator('astro-island')).toHaveCount(0);
  }
  await page.goto('/work/cell-growth-simulator/');
  await expect(page.locator('astro-island')).toHaveCount(1);
});

test('search and social tags are in place', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://cheekane.com/',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://cheekane.com/og.png',
  );
  expect((await request.get('/og.png')).ok()).toBe(true);
  expect(await (await request.get('/robots.txt')).text()).toContain('sitemap-index.xml');
  expect(await (await request.get('/sitemap-0.xml')).text()).toContain(
    'https://cheekane.com/work/mealvue/',
  );
});
