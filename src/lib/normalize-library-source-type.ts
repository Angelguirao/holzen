/**
 * `library_items.source_type` is stored as canonical strings (`pause`, `pause_note`, …).
 * This helper only normalizes null/undefined; legacy discriminator rewrites were removed.
 */
export function normalizeLibrarySourceType(sourceType: string | null | undefined): string | undefined {
  if (!sourceType) return undefined;
  return sourceType;
}

/** True when this row is the main pause bookmark (outcome UI, duplicate detection, etc.). */
export function isMainPauseLibraryBookmark(sourceType: string | null | undefined): boolean {
  return sourceType === 'pause';
}

/** Pause-scoped user note rows in the library (distinct from companion slots). */
export function isPauseLibraryNote(sourceType: string | null | undefined): boolean {
  return sourceType === 'pause_note';
}
