import type { QueryClient } from '@tanstack/react-query';

export const HISTORY_CALENDAR_ACTIVITIES_QUERY_PREFIX = ['history-calendar', 'activities'] as const;

export const HISTORY_CALENDAR_ACTIVITIES_DISABLED_USER_ID = 'none' as const;

export const HISTORY_CALENDAR_ACTIVITIES_NONE_QUERY_KEY = [
  ...HISTORY_CALENDAR_ACTIVITIES_QUERY_PREFIX,
  HISTORY_CALENDAR_ACTIVITIES_DISABLED_USER_ID,
] as const;

/**
 * TanStack Query key for Profile → Library “activity” calendar bundle
 * (`HistoryContent`: pauses, letters, badges, practice entries).
 */
export function historyCalendarActivitiesQueryKey(userId: string) {
  return [...HISTORY_CALENDAR_ACTIVITIES_QUERY_PREFIX, userId] as const;
}

/** Bump the activity calendar after server writes that affect its sources (e.g. practice_entries, user_badges). */
export function invalidateHistoryCalendarActivities(queryClient: QueryClient, userId: string) {
  void queryClient.invalidateQueries({ queryKey: historyCalendarActivitiesQueryKey(userId) });
}
