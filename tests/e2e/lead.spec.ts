import { expect, experience, projects, test } from './fixtures';

test('the lead feature is the first entry in experience.yaml', async ({ page }) => {
  const first = experience[0]!;
  await page.goto('/');
  const lead = page.getByTestId('lead');
  await expect(lead).toHaveAttribute('data-lead-id', first.id);
  await expect(lead.getByRole('heading', { level: 2 })).toHaveText(first.company!);
});

test('the lead feature links to its case study', async ({ page }) => {
  const first = experience[0]!;
  test.skip(!first.caseStudy, 'The first entry has no case study.');
  await page.goto('/');
  await page.getByTestId('lead').getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`/work/${first.id}/$`));
});

test('experience is listed in file order', async ({ page }) => {
  await page.goto('/');
  const ids = await page
    .getByTestId('experience-list')
    .locator('> li')
    .evaluateAll((items) => items.map((item) => item.getAttribute('data-id')));
  expect(ids).toEqual(experience.map((entry) => entry.id));
});

test('projects are listed in file order', async ({ page }) => {
  await page.goto('/');
  const ids = await page
    .getByTestId('project-list')
    .locator('> li')
    .evaluateAll((items) => items.map((item) => item.getAttribute('data-id')));
  expect(ids).toEqual(projects.map((entry) => entry.id));
});
