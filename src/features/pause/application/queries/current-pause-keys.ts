import { PAUSE_QUERY_PREFIX } from './pause-query-namespace';

export const CURRENT_PAUSE_QUERY_LEAF = 'current-open' as const;

export const CURRENT_PAUSE_QUERY_PREFIX = [
  ...PAUSE_QUERY_PREFIX,
  CURRENT_PAUSE_QUERY_LEAF,
] as const;

export const CURRENT_PAUSE_DISABLED_USER_ID = 'none' as const;

export const CURRENT_PAUSE_NONE_QUERY_KEY = [
  ...CURRENT_PAUSE_QUERY_PREFIX,
  CURRENT_PAUSE_DISABLED_USER_ID,
] as const;

export function currentPauseQueryKey(userId: string) {
  return [...CURRENT_PAUSE_QUERY_PREFIX, userId] as const;
}
