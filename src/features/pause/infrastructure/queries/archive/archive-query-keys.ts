/** TanStack key helpers for pause archive lists (no Supabase). */

export const PAUSE_ARCHIVE_LIST_QUERY_PREFIX = ['pause-archive'] as const;

/** Prefix for TanStack invalidation when pause lifecycle bumps archive-related caches. */
export function pauseArchiveListQueryPrefix(userId: string) {
  return [...PAUSE_ARCHIVE_LIST_QUERY_PREFIX, userId] as const;
}
