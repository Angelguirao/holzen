export const HOME_PRACTICE_STATS_QUERY_PREFIX = ['home', 'practice-stats'] as const;

export const HOME_PRACTICE_STATS_DISABLED_USER_ID = '__none__' as const;

export const HOME_PRACTICE_STATS_NONE_KEY = [
  ...HOME_PRACTICE_STATS_QUERY_PREFIX,
  HOME_PRACTICE_STATS_DISABLED_USER_ID,
] as const;

export const HOME_PRACTICE_STATS_QUERY_KEY = (userId: string) =>
  [...HOME_PRACTICE_STATS_QUERY_PREFIX, userId] as const;
