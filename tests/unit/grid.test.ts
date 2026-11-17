import { describe, expect, it } from 'vitest';
import { centreOf, countOccupied, createGrid, stepGrid, toggleCell } from '@/demo/cell-growth/grid';
import type { Grid } from '@/demo/cell-growth/grid';

/** Draws a grid as text, "#" for occupied and "." for empty. */
const draw = (grid: Grid) => grid.map((row) => row.map((cell) => (cell ? '#' : '.')).join(''));

/** Reads a grid from text drawn the same way. */
const read = (rows: string[]): Grid => rows.map((row) => [...row].map((cell) => cell === '#'));

describe('createGrid', () => {
  it('builds an empty grid of the right shape', () => {
    const grid = createGrid(2, 3);
    expect(draw(grid)).toEqual(['...', '...']);
  });

  it('places the starting cells', () => {
    expect(draw(createGrid(2, 2, [[1, 0]]))).toEqual(['..', '#.']);
  });

  it('ignores starting cells outside the grid', () => {
    expect(countOccupied(createGrid(2, 2, [[5, 5]]))).toBe(0);
  });

  it('rejects a grid with no rows or columns', () => {
    expect(() => createGrid(0, 3)).toThrow(RangeError);
    expect(() => createGrid(3, 0)).toThrow(RangeError);
  });
});

describe('toggleCell', () => {
  it('adds bacteria to an empty cell and removes it again', () => {
    const empty = createGrid(2, 2);
    const added = toggleCell(empty, 0, 1);
    expect(draw(added)).toEqual(['.#', '..']);
    expect(draw(toggleCell(added, 0, 1))).toEqual(['..', '..']);
  });

  it('does not change the grid it is given', () => {
    const grid = createGrid(2, 2);
    toggleCell(grid, 0, 0);
    expect(countOccupied(grid)).toBe(0);
  });
});

describe('stepGrid growth rules', () => {
  it('divides up first', () => {
    expect(draw(stepGrid(read(['...', '.#.', '...'])))).toEqual(['.#.', '.#.', '...']);
  });

  it('divides down when up is taken', () => {
    // The middle cell goes down. The top cell has no up or down, so it goes left.
    expect(draw(stepGrid(read(['.#.', '.#.', '...'])))).toEqual(['##.', '.#.', '.#.']);
  });

  it('divides down when up is outside the grid', () => {
    expect(draw(stepGrid(read(['.#.', '...'])))).toEqual(['.#.', '.#.']);
  });

  it('divides left when up and down are not free', () => {
    expect(draw(stepGrid(read(['.#'])))).toEqual(['##']);
  });

  it('divides right as the last choice', () => {
    expect(draw(stepGrid(read(['#.'])))).toEqual(['##']);
  });

  it('never divides diagonally', () => {
    const next = stepGrid(read(['...', '.#.', '...']));
    expect([next[0]![0], next[0]![2], next[2]![0], next[2]![2]]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('adds at most one new cell for each occupied cell', () => {
    const before = read(['.....', '.#.#.', '.....']);
    expect(countOccupied(stepGrid(before))).toBe(4);
  });

  it('decides from the grid as it was before the tick', () => {
    // The cell added in row 0 must not divide again in the same tick.
    expect(draw(stepGrid(read(['....', '#...', '....'])))).toEqual(['#...', '#...', '....']);
  });

  it('fills a shared space once when two cells choose it', () => {
    // The top cell divides down and the bottom cell divides up, into the same space.
    const next = stepGrid(read(['#', '.', '#']));
    expect(draw(next)).toEqual(['#', '#', '#']);
  });

  it('never removes bacteria', () => {
    const before = read(['#..', '.#.', '..#']);
    const after = stepGrid(before);
    before.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) expect(after[r]![c]).toBe(true);
      }),
    );
  });

  it('does not change the grid it is given', () => {
    const before = read(['...', '.#.', '...']);
    stepGrid(before);
    expect(draw(before)).toEqual(['...', '.#.', '...']);
  });

  it('returns the same grid when the dish is full', () => {
    const full = read(['##', '##']);
    expect(stepGrid(full)).toBe(full);
  });

  it('returns the same grid when the dish is empty', () => {
    const empty = createGrid(3, 3);
    expect(stepGrid(empty)).toBe(empty);
  });

  it('fills the whole dish from one cell, then stops', () => {
    let grid = createGrid(6, 6, [centreOf(6, 6)]);
    let ticks = 0;
    for (;;) {
      const next = stepGrid(grid);
      if (next === grid) break;
      grid = next;
      ticks += 1;
      expect(ticks).toBeLessThan(100);
    }
    expect(countOccupied(grid)).toBe(36);
  });
});

describe('centreOf', () => {
  it('finds the middle cell', () => {
    expect(centreOf(5, 5)).toEqual([2, 2]);
    expect(centreOf(20, 20)).toEqual([9, 9]);
  });
});
