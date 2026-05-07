/**
 * TanStack Query key for Profile → Library “activity” calendar bundle
 * (`HistoryContent`: pauses, letters, badges, practice entries).
 */
export function historyCalendarActivitiesQueryKey(userId: string) {
  return ['history-calendar', 'activities', userId] as const;
}
