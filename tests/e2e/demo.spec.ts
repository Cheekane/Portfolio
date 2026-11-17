import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Reads the number out of "Generation 12". */
const generationOf = async (text: Promise<string | null>) =>
  Number((await text)?.match(/\d+/)?.[0]);

async function openDemo(page: Page) {
  await page.goto('/work/cell-growth-simulator/');
  const demo = page.getByTestId('cell-growth');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toHaveAttribute('data-ready', 'true');
  return {
    demo,
    generation: demo.getByTestId('generation'),
    occupied: demo.getByTestId('occupied'),
    cell: (row: number, col: number) =>
      demo.getByRole('gridcell', { name: `Row ${row}, column ${col}`, exact: true }),
  };
}

test('starts with one cell and grows when started', async ({ page }) => {
  const { demo, generation, occupied } = await openDemo(page);
  await expect(occupied).toHaveText('1 of 400 cells occupied');
  await expect(generation).toHaveText('Generation 0');

  await demo.getByLabel('Speed').selectOption('8');
  await demo.getByRole('button', { name: 'Start' }).click();
  await expect.poll(() => generationOf(generation.textContent())).toBeGreaterThanOrEqual(3);

  await demo.getByRole('button', { name: 'Pause' }).click();
  const paused = await generation.textContent();
  await page.waitForTimeout(400);
  await expect(generation).toHaveText(paused!);
  await expect(occupied).not.toHaveText('1 of 400 cells occupied');
});

test('clicking a cell adds and removes bacteria', async ({ page }) => {
  const { occupied, cell } = await openDemo(page);
  await cell(1, 1).click();
  await expect(cell(1, 1)).toHaveAttribute('aria-selected', 'true');
  await expect(occupied).toHaveText('2 of 400 cells occupied');
  await cell(1, 1).click();
  await expect(cell(1, 1)).toHaveAttribute('aria-selected', 'false');
  await expect(occupied).toHaveText('1 of 400 cells occupied');
});

test('reset clears the dish', async ({ page }) => {
  const { demo, generation, occupied } = await openDemo(page);
  await demo.getByRole('button', { name: 'Reset' }).click();
  await expect(occupied).toHaveText('0 of 400 cells occupied');
  await expect(generation).toHaveText('Generation 0');
});

test('spacebar starts and pauses, R resets', async ({ page }) => {
  const { demo, generation, occupied, cell } = await openDemo(page);
  await demo.getByLabel('Speed').selectOption('8');
  await cell(10, 10).focus();

  await page.keyboard.press('Space');
  await expect(demo.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect.poll(() => generationOf(generation.textContent())).toBeGreaterThanOrEqual(2);

  await page.keyboard.press('Space');
  await expect(demo.getByRole('button', { name: 'Start' })).toBeVisible();

  await page.keyboard.press('r');
  await expect(occupied).toHaveText('0 of 400 cells occupied');
  await expect(generation).toHaveText('Generation 0');
});

test('arrow keys move around the grid and Enter toggles a cell', async ({ page }) => {
  const { occupied, cell } = await openDemo(page);
  await cell(1, 1).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(cell(2, 2)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cell(2, 2)).toHaveAttribute('aria-selected', 'true');
  await expect(occupied).toHaveText('2 of 400 cells occupied');
});

test('the grid size can be changed', async ({ page }) => {
  const { demo, occupied } = await openDemo(page);
  await demo.getByLabel('Grid').selectOption('10');
  await expect(occupied).toHaveText('1 of 100 cells occupied');
  await expect(demo.getByRole('gridcell')).toHaveCount(100);
});

test('the simulation stops by itself when the dish is full', async ({ page }) => {
  const { demo, occupied } = await openDemo(page);
  await demo.getByLabel('Grid').selectOption('10');
  await demo.getByLabel('Speed').selectOption('8');
  await demo.getByRole('button', { name: 'Start' }).click();
  await expect(occupied).toHaveText('100 of 100 cells occupied', { timeout: 15_000 });
  await expect(demo.getByRole('button', { name: 'Start' })).toBeVisible();
});
