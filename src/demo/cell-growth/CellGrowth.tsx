import { memo, useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { countOccupied } from './grid';
import { SIZES, SPEEDS, initialState, intervalFor, reduce } from './state';
import './cell-growth.css';

interface CellProps {
  row: number;
  col: number;
  occupied: boolean;
  /** Only one cell is in the tab order at a time. Arrow keys move it. */
  tabStop: boolean;
  onToggle: (row: number, col: number) => void;
  onFocus: (row: number, col: number) => void;
}

const Cell = memo(function Cell({ row, col, occupied, tabStop, onToggle, onFocus }: CellProps) {
  return (
    <div
      role="gridcell"
      className="cg-cell"
      aria-label={`Row ${row + 1}, column ${col + 1}`}
      aria-selected={occupied}
      data-row={row}
      data-col={col}
      tabIndex={tabStop ? 0 : -1}
      onClick={() => onToggle(row, col)}
      onFocus={() => onFocus(row, col)}
    />
  );
});

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export default function CellGrowth() {
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState());
  const { grid, size, speed, running, generation } = state;
  const [active, setActive] = useState<readonly [number, number]>([0, 0]);
  const gridRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Marks the demo as interactive, so tests know when clicks will register.
  useEffect(() => {
    if (rootRef.current) rootRef.current.dataset['ready'] = 'true';
  }, []);

  // One timer drives the whole grid. Changing speed or pausing replaces it.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), intervalFor(speed));
    return () => window.clearInterval(timer);
  }, [running, speed]);

  const toggle = useCallback((row: number, col: number) => {
    dispatch({ type: 'toggleCell', row, col });
  }, []);

  const focusCell = useCallback((row: number, col: number) => {
    setActive([row, col]);
  }, []);

  const moveFocus = (row: number, col: number) => {
    const nextRow = Math.min(size - 1, Math.max(0, row));
    const nextCol = Math.min(size - 1, Math.max(0, col));
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-row="${nextRow}"][data-col="${nextCol}"]`)
      ?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    const onCell = target.getAttribute('role') === 'gridcell';
    const onControl = target.tagName === 'BUTTON' || target.tagName === 'SELECT';

    if (event.key === 'r' || event.key === 'R') {
      // Typing "r" in a select jumps to an option, so leave that alone.
      if (target.tagName === 'SELECT') return;
      event.preventDefault();
      dispatch({ type: 'reset' });
      return;
    }

    if (event.key === ' ' && !onControl) {
      // Buttons and selects already use the spacebar themselves.
      event.preventDefault();
      dispatch({ type: 'toggleRunning' });
      return;
    }

    if (!onCell) return;
    const row = Number(target.dataset['row']);
    const col = Number(target.dataset['col']);

    if (event.key === 'Enter') {
      event.preventDefault();
      toggle(row, col);
      return;
    }

    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      moveFocus(row + arrow[0], col + arrow[1]);
    }
  };

  const occupied = countOccupied(grid);
  const total = size * size;
  const tabRow = Math.min(active[0], size - 1);
  const tabCol = Math.min(active[1], size - 1);

  return (
    // The wrapper only listens for keys that bubble up from the grid and controls.
    <div className="cg" ref={rootRef} onKeyDown={onKeyDown} data-testid="cell-growth">
      <div
        ref={gridRef}
        role="grid"
        className="cg-grid"
        aria-label={`Petri dish, ${size} by ${size} cells`}
        aria-describedby={`${id}-help`}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {grid.map((cells, row) => (
          <div role="row" className="cg-row" key={row}>
            {cells.map((cell, col) => (
              <Cell
                key={col}
                row={row}
                col={col}
                occupied={cell}
                tabStop={row === tabRow && col === tabCol}
                onToggle={toggle}
                onFocus={focusCell}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="cg-panel">
        <p className="cg-status" role="status" aria-live={running ? 'off' : 'polite'}>
          <span data-testid="generation">Generation {generation}</span>
          <span aria-hidden="true"> / </span>
          <span data-testid="occupied">
            {occupied} of {total} cells occupied
          </span>
        </p>

        <div className="cg-controls">
          <button
            type="button"
            className="cg-button cg-primary"
            onClick={() => dispatch({ type: 'toggleRunning' })}
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="cg-button" onClick={() => dispatch({ type: 'reset' })}>
            Reset
          </button>

          <label className="cg-field">
            <span>Speed</span>
            <select
              value={speed}
              onChange={(event) =>
                dispatch({ type: 'setSpeed', speed: Number(event.target.value) })
              }
            >
              {SPEEDS.map((option) => (
                <option key={option} value={option}>
                  x{option}
                </option>
              ))}
            </select>
          </label>

          <label className="cg-field">
            <span>Grid</span>
            <select
              value={size}
              onChange={(event) => dispatch({ type: 'setSize', size: Number(event.target.value) })}
            >
              {SIZES.map((option) => (
                <option key={option} value={option}>
                  {option} x {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="cg-help" id={`${id}-help`}>
          Click a cell to add or remove bacteria. With the grid in focus, press Space to start or
          pause, R to reset, the arrow keys to move and Enter to toggle a cell.
        </p>
      </div>
    </div>
  );
}
