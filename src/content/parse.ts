import { parse } from 'yaml';

/**
 * Reads a YAML list and records each entry's position as `order`.
 * The position in the file is the single source of truth for ordering.
 */
export function parseOrderedList(text: string): Record<string, unknown>[] {
  const list: unknown = parse(text);
  if (!Array.isArray(list)) {
    throw new Error('Expected the content file to be a YAML list.');
  }
  return list.map((entry: Record<string, unknown>, order) => ({ ...entry, order }));
}
