/**
 * Home section order normalization (Customize sheet + persisted layout).
 *
 * **Pinned head:** `goal-why` ("Why you stay") is always index 0 — not part of the DnD pool.
 *
 * **Tail (everything after `goal-why`):** `night`, `market`, `your-pause`, `journey-pulse`,
 * `quick-capture` may reorder freely, except `market` and `your-pause` must stay adjacent so
 * `buildHomeRenderableSegments` can emit one `todayBlock` when both are visible. If any
 * other id sits between them, those in-between ids are moved to immediately after the pair,
 * preserving their relative order (and preserving whether `market` or `your-pause` comes
 * first in the pair, as in the merged tail).
 */

export const GOAL_WHY_SECTION_ID = 'goal-why' as const;

export function mergeOrderWithDefaults(parsed: string[], defaultOrder: readonly string[]): string[] {
  const merged = parsed.filter((id) => defaultOrder.includes(id));
  const missing = defaultOrder.filter((id) => !merged.includes(id));
  return [...merged, ...missing];
}

/**
 * Ensures `market` and `your-pause` are consecutive in the tail. Any sections strictly
 * between them are relocated after the pair; relative order of those displaced ids is kept.
 */
export function normalizeTailMarketPauseAdjacent(tail: string[]): string[] {
  const iM = tail.indexOf('market');
  const iY = tail.indexOf('your-pause');
  if (iM < 0 || iY < 0) return [...tail];
  const lo = Math.min(iM, iY);
  const hi = Math.max(iM, iY);
  if (hi - lo <= 1) return [...tail];
  const between = tail.slice(lo + 1, hi);
  const pair: [string, string] = [tail[lo], tail[hi]];
  const before = tail.slice(0, lo);
  const after = tail.slice(hi + 1);
  return [...before, ...pair, ...between, ...after];
}

export function normalizeHomeSectionOrder(
  input: string[],
  defaultOrder: readonly string[],
): string[] {
  const merged = mergeOrderWithDefaults([...input], defaultOrder);
  const tailDefault = defaultOrder.filter((id) => id !== GOAL_WHY_SECTION_ID);
  const tailMerged = mergeOrderWithDefaults(
    merged.filter((id) => id !== GOAL_WHY_SECTION_ID),
    tailDefault,
  );
  const tailNorm = normalizeTailMarketPauseAdjacent(tailMerged);
  return [GOAL_WHY_SECTION_ID, ...tailNorm];
}
