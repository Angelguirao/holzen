/** TanStack key helpers for completed pause_instance count (no Supabase). */

export const COMPLETED_PAUSE_COUNT_QUERY_PREFIX = ['pause-instances', 'completed-count'] as const;

/** Signed-out placeholder segment (matches other `__none__` user-id keys). */
export const COMPLETED_PAUSE_COUNT_DISABLED_USER_ID = '__none__' as const;

export const COMPLETED_PAUSE_COUNT_NONE_KEY = [
  ...COMPLETED_PAUSE_COUNT_QUERY_PREFIX,
  COMPLETED_PAUSE_COUNT_DISABLED_USER_ID,
] as const;

export const COMPLETED_PAUSE_COUNT_QUERY_KEY = (userId: string) =>
  [...COMPLETED_PAUSE_COUNT_QUERY_PREFIX, userId] as const;
