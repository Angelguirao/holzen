/** TanStack key helpers for archive pauses-tab visibility probe (no Supabase). */

export const ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX = ['archive', 'pauses-tab-has-rows'] as const;

/** Disabled / tab-hidden placeholder segment (paired with nonce when enabled). */
export const ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_SEGMENT = '__off__' as const;

export const ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_QUERY_KEY = [
  ...ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX,
  ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_SEGMENT,
] as const;

export function archivePausesTabHasRowsQueryKey(userId: string, nonce: number) {
  return [...ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX, userId, nonce] as const;
}

/** Prefix for `invalidateQueries` — matches all nonce variants for the user. */
export function archivePausesTabHasRowsQueryPrefix(userId: string) {
  return [...ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX, userId] as const;
}
