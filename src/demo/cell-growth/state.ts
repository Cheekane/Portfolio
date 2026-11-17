import { centreOf, createGrid, stepGrid, toggleCell } from './grid';
import type { Grid } from './grid';

export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export const SIZES = [10, 20, 30, 40] as const;

/** Time between ticks at speed x1, in milliseconds. */
export const BASE_INTERVAL_MS = 1000;

export interface SimState {
  grid: Grid;
  size: number;
  speed: number;
  running: boolean;
  /** How many ticks have run since the last reset. */
  generation: number;
}

export type SimAction =
  | { type: 'tick' }
  | { type: 'toggleRunning' }
  | { type: 'reset' }
  | { type: 'toggleCell'; row: number; col: number }
  | { type: 'setSpeed'; speed: number }
  | { type: 'setSize'; size: number };

/** The first thing a visitor sees: one cell in the middle, ready to grow. */
export function initialState(size = 20): SimState {
  return {
    grid: createGrid(size, size, [centreOf(size, size)]),
    size,
    speed: 1,
    running: false,
    generation: 0,
  };
}

export function reduce(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'tick': {
      const grid = stepGrid(state.grid);
      // Nothing left to divide into, so stop the clock.
      if (grid === state.grid) return { ...state, running: false };
      return { ...state, grid, generation: state.generation + 1 };
    }
    case 'toggleRunning':
      return { ...state, running: !state.running };
    case 'reset':
      // Like the original app, reset clears the dish.
      return {
        ...state,
        grid: createGrid(state.size, state.size),
        running: false,
        generation: 0,
      };
    case 'toggleCell':
      return { ...state, grid: toggleCell(state.grid, action.row, action.col) };
    case 'setSpeed':
      return { ...state, speed: action.speed };
    case 'setSize':
      return { ...initialState(action.size), speed: state.speed };
  }
}

export function intervalFor(speed: number): number {
  return BASE_INTERVAL_MS / speed;
}
