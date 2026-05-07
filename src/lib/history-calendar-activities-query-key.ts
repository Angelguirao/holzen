import type { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query key for Profile → Library “activity” calendar bundle
 * (`HistoryContent`: pauses, letters, badges, practice entries).
 */
export function historyCalendarActivitiesQueryKey(userId: string) {
  return ['history-calendar', 'activities', userId] as const;
}

/** Bump the activity calendar after server writes that affect its sources (e.g. practice_entries, user_badges). */
export function invalidateHistoryCalendarActivities(queryClient: QueryClient, userId: string) {
  void queryClient.invalidateQueries({ queryKey: historyCalendarActivitiesQueryKey(userId) });
}
