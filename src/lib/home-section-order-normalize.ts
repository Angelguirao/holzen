/**
 * Home section order normalization (Customize sheet + persisted layout).
 *
 * **Pinned head:** `goal-why` ("Why you stay") is always index 0 — not part of the DnD pool.
 *
 * **Tail:** All other sections keep **relative order** from Customize. Home renders that tail
 * inside one "Today" block after the anchor row.
 */

export const GOAL_WHY_SECTION_ID = 'goal-why' as const;

export function mergeOrderWithDefaults(parsed: string[], defaultOrder: readonly string[]): string[] {
  const merged = parsed.filter((id) => defaultOrder.includes(id));
  const missing = defaultOrder.filter((id) => !merged.includes(id));
  return [...merged, ...missing];
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
  return [GOAL_WHY_SECTION_ID, ...tailMerged];
}
