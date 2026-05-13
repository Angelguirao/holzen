/**
 * Pause stats data loader.
 *
 * Reads everything Stats + Badges need from the new tables in one trip:
 *   - v_pause_full (instance rows + step presence + counted companion count
 *     + artifact text)
 *   - pause_step_events (raw events, used for mood-shift / note-depth /
 *     favorite counters that need payloads, not just presence flags)
 *   - pause_companion_events (raw events, used for Reappraisal effect
 *     calculations + Badge companion counters)
 *
 * Returns { ready, rows, stepEvents, companionEvents, refresh }.
 * Data is shared via TanStack Query so Home + Journey + Badges do not
 * each issue the same three parallel Supabase reads on every visit.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getPauseStatsDataDisabledQueryOptions,
  getPauseStatsDataQueryOptions,
  PAUSE_STATS_DATA_NONE_QUERY_KEY,
  PAUSE_STATS_DATA_QUERY_KEY,
} from '@/lib/pause-stats-data-query';
import type { PauseStatsQueryPayload, PauseFullRow } from '@/lib/pause-stats-data-query';

export type { PauseFullRow, PauseStatsQueryPayload };
export { PAUSE_STATS_DATA_NONE_QUERY_KEY, PAUSE_STATS_DATA_QUERY_KEY };

export interface UsePauseStatsData {
  ready: boolean;
  rows: PauseFullRow[];
  stepEvents: PauseStatsQueryPayload['stepEvents'];
  companionEvents: PauseStatsQueryPayload['companionEvents'];
  refresh: () => Promise<void>;
}

export function usePauseStatsData(): UsePauseStatsData {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const q = useQuery({
    ...(user ? getPauseStatsDataQueryOptions(user.id) : getPauseStatsDataDisabledQueryOptions()),
    enabled: !!user,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: PAUSE_STATS_DATA_QUERY_KEY(user.id) });
  }, [queryClient, user]);

  const ready = !user || q.isFetched;
  const data = useMemo(
    () => q.data ?? { rows: [], stepEvents: [], companionEvents: [] },
    [q.data],
  );

  if (!user) {
    return {
      ready: true,
      rows: [],
      stepEvents: [],
      companionEvents: [],
      refresh: async () => {},
    };
  }

  return {
    ready,
    rows: data.rows,
    stepEvents: data.stepEvents,
    companionEvents: data.companionEvents,
    refresh,
  };
}
