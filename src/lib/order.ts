/** Anything that remembers its position in the content file. */
export interface Ordered {
  order: number;
}

/** Returns the entries in the order they are written in the content file. */
export function inListOrder<T extends Ordered>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => a.order - b.order);
}

/**
 * The entry featured at the top of the home page: whatever comes first in
 * the list. Put a new entry at the top of the file and it becomes the lead.
 */
export function leadOf<T extends Ordered>(entries: readonly T[]): T | undefined {
  return inListOrder(entries)[0];
}
