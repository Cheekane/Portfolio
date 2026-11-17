/**
 * Growth rules for the Cell Growth Simulator, ported from
 * https://github.com/Cheekane/Cell-Growth-Simulation
 *
 * The grid is a list of rows. A cell is true when bacteria occupy it.
 * These functions are pure: they never change the grid they are given.
 */

export type Grid = readonly (readonly boolean[])[];

export type Position = readonly [row: number, col: number];

/** The order a cell looks for an empty space to divide into. */
const NEIGHBOURS: readonly Position[] = [
  [-1, 0], // up
  [1, 0], // down
  [0, -1], // left
  [0, 1], // right
];

/** Builds an empty grid, with optional cells that start occupied. */
export function createGrid(rows: number, cols: number, occupied: readonly Position[] = []): Grid {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new RangeError('A grid needs at least one row and one column.');
  }
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
  for (const [row, col] of occupied) {
    const target = grid[row];
    if (target && col >= 0 && col < cols) target[col] = true;
  }
  return grid;
}

/** Flips one cell between occupied and empty. */
export function toggleCell(grid: Grid, row: number, col: number): Grid {
  return grid.map((cells, r) =>
    r === row ? cells.map((cell, c) => (c === col ? !cell : cell)) : cells,
  );
}

/**
 * Runs one tick. Every occupied cell divides into the first empty space
 * next to it, checking up, down, left, then right.
 *
 * Each cell decides from the grid as it was before the tick, so the result
 * does not depend on the order cells are visited in, and two cells that pick
 * the same space simply fill it once.
 *
 * Returns the same grid object when nothing changed, which is how callers
 * know the dish is full (or empty) and the simulation can stop.
 */
export function stepGrid(grid: Grid): Grid {
  const next = grid.map((cells) => [...cells]);
  let changed = false;

  grid.forEach((cells, row) => {
    cells.forEach((cell, col) => {
      if (!cell) return;
      for (const [dRow, dCol] of NEIGHBOURS) {
        const target = grid[row + dRow]?.[col + dCol];
        // `undefined` means the neighbour is outside the grid.
        if (target === false) {
          (next[row + dRow] as boolean[])[col + dCol] = true;
          changed = true;
          break;
        }
      }
    });
  });

  return changed ? next : grid;
}

export function countOccupied(grid: Grid): number {
  return grid.reduce((total, cells) => total + cells.filter(Boolean).length, 0);
}

/** The cell closest to the middle of the grid. */
export function centreOf(rows: number, cols: number): Position {
  return [Math.floor((rows - 1) / 2), Math.floor((cols - 1) / 2)];
}
