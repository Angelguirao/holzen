/**
 * Canonical `library_items.source_type` values are `pause` / `pause_note`.
 * Maps pre-migration rows so UI and filters stay correct until DB backfill runs.
 */
export function normalizeLibrarySourceType(sourceType: string | null | undefined): string | undefined {
  if (!sourceType) return undefined;
  if (sourceType === 'reflection') return 'pause';
  if (sourceType === 'reflection_note') return 'pause_note';
  return sourceType;
}

/** True when this row is the main pause bookmark (outcome UI, duplicate detection, etc.). */
export function isMainPauseLibraryBookmark(sourceType: string | null | undefined): boolean {
  return normalizeLibrarySourceType(sourceType) === 'pause';
}

/** Pause-scoped user note rows in the library (distinct from companion slots). */
export function isPauseLibraryNote(sourceType: string | null | undefined): boolean {
  return normalizeLibrarySourceType(sourceType) === 'pause_note';
}
