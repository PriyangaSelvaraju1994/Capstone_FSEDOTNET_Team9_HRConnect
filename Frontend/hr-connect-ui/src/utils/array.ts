/** Returns `[0, 1, …, n-1]`. Useful for rendering N skeleton placeholders. */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
