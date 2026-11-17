import { describe, expect, it } from 'vitest';
import { formatMonth, formatRange } from '@/lib/dates';

describe('dates', () => {
  it('formats a month', () => {
    expect(formatMonth('2026-09')).toBe('Sep 2026');
    expect(formatMonth('2020-12')).toBe('Dec 2020');
  });

  it('formats a finished range', () => {
    expect(formatRange('2024-09', '2025-08')).toBe('Sep 2024 to Aug 2025');
  });

  it('formats a current role', () => {
    expect(formatRange('2026-09')).toBe('Sep 2026 to present');
  });

  it('rejects a month that does not exist', () => {
    expect(() => formatMonth('2026-13')).toThrow();
  });
});
