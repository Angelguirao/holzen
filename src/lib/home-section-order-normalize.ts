/**
 * Home section order normalization (Customize sheet + persisted layout).
 *
 * **Rule (wireframe):** `goal-why` sits immediately before the Today pair. The pair
 * `market` → `your-pause` must stay consecutive so `buildHomeRenderableSegments` can emit
 * a single `todayBlock`. Nothing (including `journey-pulse`) may sit between `market` and
 * `your-pause`, or between `goal-why` and `market`.
 *
 * **Algorithm:** Take merged full layout order, find the minimum index among the three
 * anchor ids, count how many *movable* ids appear before that index — that is the insert
 * rank for the contiguous block `[goal-why, market, your-pause]`. Movable ids preserve
 * their relative order from the merged list; the anchor block is spliced at `rank`.
 */

export const HOME_LAYOUT_BLOCK_TRIPLE = ['goal-why', 'market', 'your-pause'] as const;

/** Sections the user may reorder in Customize (Hold mode); anchors stay fixed as a group. */
export const HOME_MOVABLE_SECTION_IDS = ['night', 'journey-pulse', 'quick-capture'] as const;

const MOVABLE_SET = new Set<string>(HOME_MOVABLE_SECTION_IDS);

export function mergeOrderWithDefaults(parsed: string[], defaultOrder: readonly string[]): string[] {
  const merged = parsed.filter((id) => defaultOrder.includes(id));
  const missing = defaultOrder.filter((id) => !merged.includes(id));
  return [...merged, ...missing];
}

/** How many movable sections appear before the earliest anchor (`goal-why`|`market`|`your-pause`). */
export function computeBlockInsertRank(ordered: string[]): number {
  const indices: number[] = [];
  for (const id of HOME_LAYOUT_BLOCK_TRIPLE) {
    const i = ordered.indexOf(id);
    if (i >= 0) indices.push(i);
  }
  if (indices.length === 0) return 0;
  const minIdx = Math.min(...indices);
  let rank = 0;
  for (let i = 0; i < minIdx; i++) {
    if (MOVABLE_SET.has(ordered[i])) rank++;
  }
  return rank;
}

export function normalizeHomeSectionOrder(
  input: string[],
  defaultOrder: readonly string[],
): string[] {
  const merged = mergeOrderWithDefaults([...input], defaultOrder);
  const onlyMovables = merged.filter((id) => MOVABLE_SET.has(id));
  const rank = computeBlockInsertRank(merged);
  const block = [...HOME_LAYOUT_BLOCK_TRIPLE];
  return [...onlyMovables.slice(0, rank), ...block, ...onlyMovables.slice(rank)];
}
