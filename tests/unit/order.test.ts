import { describe, expect, it } from 'vitest';
import { inListOrder, leadOf } from '@/lib/order';
import { parseOrderedList } from '@/content/parse';

const yaml = (ids: string[]) => ids.map((id) => `- id: ${id}`).join('\n');
const ids = (entries: { id?: unknown }[]) => entries.map((entry) => entry.id);

describe('list order', () => {
  it('records the position of each entry in the file', () => {
    const entries = parseOrderedList(yaml(['newest', 'middle', 'oldest']));
    expect(entries.map((entry) => entry['order'])).toEqual([0, 1, 2]);
  });

  it('rejects a file that is not a list', () => {
    expect(() => parseOrderedList('id: alone')).toThrow(/list/);
  });

  it('keeps file order even when the entries arrive shuffled', () => {
    const [a, b, c] = parseOrderedList(yaml(['a', 'b', 'c'])) as { id: string; order: number }[];
    expect(ids(inListOrder([c!, a!, b!]))).toEqual(['a', 'b', 'c']);
  });

  it('does not change the list it is given', () => {
    const entries = [{ order: 1 }, { order: 0 }];
    inListOrder(entries);
    expect(entries).toEqual([{ order: 1 }, { order: 0 }]);
  });
});

describe('lead feature', () => {
  const parse = (list: string[]) => parseOrderedList(yaml(list)) as { id: string; order: number }[];

  it('is the first entry in the file', () => {
    expect(leadOf(parse(['mealvue', 'jitto']))?.id).toBe('mealvue');
  });

  it('changes when the file is reordered', () => {
    expect(leadOf(parse(['jitto', 'mealvue']))?.id).toBe('jitto');
  });

  it('changes when a newer entry is added at the top', () => {
    expect(leadOf(parse(['new-job', 'mealvue', 'jitto']))?.id).toBe('new-job');
  });

  it('is undefined for an empty list', () => {
    expect(leadOf([])).toBeUndefined();
  });
});
