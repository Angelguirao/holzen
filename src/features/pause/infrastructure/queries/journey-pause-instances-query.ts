import type { UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JourneyPauseRow } from '@/features/pause/domain/journey-pause-row';
import {
  JOURNEY_PAUSE_INSTANCES_NONE_KEY,
  journeyPauseInstancesQueryKey,
} from '@/features/pause/application/queries/journey-pause-instances-keys';

export {
  JOURNEY_PAUSE_INSTANCES_DISABLED_USER_ID,
  JOURNEY_PAUSE_INSTANCES_NONE_KEY,
  JOURNEY_PAUSE_INSTANCES_QUERY_PREFIX,
  journeyPauseInstancesQueryKey,
} from '@/features/pause/application/queries/journey-pause-instances-keys';

export type { JourneyPauseRow } from '@/features/pause/domain/journey-pause-row';

const JOURNEY_PAUSE_INSTANCES_STALE_MS = 60_000;

/**
 * Minimal pause_instances rows for Journey overview (streak + totals).
 * Does not use v_pause_full / stats bundle.
 */
export async function fetchPauseInstancesForJourney(userId: string): Promise<JourneyPauseRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - 365);
  const { data, error } = await supabase
    .from('pause_instances' as never)
    .select('state, completed_at, engaged_at, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as JourneyPauseRow[];
}

export function getJourneyPauseInstancesQueryOptions(
  userId: string | undefined,
): Pick<UseQueryOptions<JourneyPauseRow[]>, 'queryKey' | 'queryFn' | 'enabled' | 'staleTime'> {
  return {
    queryKey: userId ? journeyPauseInstancesQueryKey(userId) : JOURNEY_PAUSE_INSTANCES_NONE_KEY,
    queryFn: () => fetchPauseInstancesForJourney(userId!),
    enabled: Boolean(userId),
    staleTime: JOURNEY_PAUSE_INSTANCES_STALE_MS,
  };
}
