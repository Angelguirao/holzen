/** TanStack key helpers for Journey pause_instances list (no Supabase). */

export const JOURNEY_PAUSE_INSTANCES_QUERY_PREFIX = ['journey', 'pause-instances'] as const;

export const JOURNEY_PAUSE_INSTANCES_DISABLED_USER_ID = '__none__' as const;

export const JOURNEY_PAUSE_INSTANCES_NONE_KEY = [
  ...JOURNEY_PAUSE_INSTANCES_QUERY_PREFIX,
  JOURNEY_PAUSE_INSTANCES_DISABLED_USER_ID,
] as const;

export const journeyPauseInstancesQueryKey = (userId: string) =>
  [...JOURNEY_PAUSE_INSTANCES_QUERY_PREFIX, userId] as const;
