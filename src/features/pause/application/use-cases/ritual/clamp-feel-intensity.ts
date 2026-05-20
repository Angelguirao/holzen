/** Ritual feel intensity slider: clamp to 1–5 with default 3. */
export function clampFeelIntensity(n: number | null | undefined): number {
  if (typeof n === 'number' && n >= 1 && n <= 5) return n;
  return 3;
}
