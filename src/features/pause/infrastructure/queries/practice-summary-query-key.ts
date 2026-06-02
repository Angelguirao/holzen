export const PRACTICE_SUMMARY_QUERY_PREFIX = ['practice', 'summary'] as const;

export const PRACTICE_SUMMARY_DISABLED_USER_ID = '__none__' as const;

export const PRACTICE_SUMMARY_NONE_KEY = [
  ...PRACTICE_SUMMARY_QUERY_PREFIX,
  PRACTICE_SUMMARY_DISABLED_USER_ID,
] as const;

export const PRACTICE_SUMMARY_QUERY_KEY = (userId: string) =>
  [...PRACTICE_SUMMARY_QUERY_PREFIX, userId] as const;
