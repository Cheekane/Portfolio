const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Turns "2026-09" into "Sep 2026". */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const name = MONTHS[Number(month) - 1];
  if (!year || !name) throw new Error(`Not a YYYY-MM month: ${yearMonth}`);
  return `${name} ${year}`;
}

/** Turns a start and an optional end into "Sep 2026 to present". */
export function formatRange(start: string, end?: string): string {
  return `${formatMonth(start)} to ${end ? formatMonth(end) : 'present'}`;
}
