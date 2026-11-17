/**
 * Joins short facts into one line, like "Role · Dates · Place".
 * The dot is glued to the word before it, so a line never starts with a dot
 * when the text wraps on a narrow screen.
 */
export function joinFacts(parts: readonly (string | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}
