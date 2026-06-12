/** Returns `singular` when count is exactly 1, otherwise `plural` (defaults to `singular + 's'`). */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Convenience: "3 days", "1 day". */
export function countLabel(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}
