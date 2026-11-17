import { describe, expect, it } from 'vitest';
import { countOccupied } from '@/demo/cell-growth/grid';
import { initialState, intervalFor, reduce } from '@/demo/cell-growth/state';

describe('simulation state', () => {
  it('starts paused with one cell in the middle', () => {
    const state = initialState();
    expect(state.running).toBe(false);
    expect(state.generation).toBe(0);
    expect(countOccupied(state.grid)).toBe(1);
  });

  it('starts and pauses', () => {
    const running = reduce(initialState(), { type: 'toggleRunning' });
    expect(running.running).toBe(true);
    expect(reduce(running, { type: 'toggleRunning' }).running).toBe(false);
  });

  it('counts a generation for every tick that grows', () => {
    const next = reduce(initialState(), { type: 'tick' });
    expect(next.generation).toBe(1);
    expect(countOccupied(next.grid)).toBe(2);
  });

  it('stops by itself when nothing can grow', () => {
    let state = reduce(initialState(10), { type: 'toggleRunning' });
    for (let i = 0; i < 200 && state.running; i += 1) state = reduce(state, { type: 'tick' });
    expect(state.running).toBe(false);
    expect(countOccupied(state.grid)).toBe(100);
  });

  it('reset clears the dish and pauses', () => {
    const running = reduce(reduce(initialState(), { type: 'toggleRunning' }), { type: 'tick' });
    const reset = reduce(running, { type: 'reset' });
    expect(reset.running).toBe(false);
    expect(reset.generation).toBe(0);
    expect(countOccupied(reset.grid)).toBe(0);
  });

  it('toggles a cell', () => {
    const state = reduce(initialState(), { type: 'toggleCell', row: 0, col: 0 });
    expect(state.grid[0]![0]).toBe(true);
  });

  it('changing the size starts a fresh dish and keeps the speed', () => {
    const fast = reduce(initialState(), { type: 'setSpeed', speed: 4 });
    const bigger = reduce(fast, { type: 'setSize', size: 30 });
    expect(bigger.grid).toHaveLength(30);
    expect(bigger.speed).toBe(4);
    expect(bigger.generation).toBe(0);
  });

  it('a higher speed means a shorter wait between ticks', () => {
    expect(intervalFor(1)).toBe(1000);
    expect(intervalFor(4)).toBe(250);
    expect(intervalFor(0.5)).toBe(2000);
  });
});
