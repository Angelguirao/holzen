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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type {
  PauseState,
  PauseStepEventRow,
  PauseCompanionEventRow,
  PauseExpiredReason,
} from '@/lib/pause-state';
import { buildDemoFixture, isDemoModeActive } from '@/lib/stats/demo-fixture';

export interface PauseFullRow {
  id: string;
  user_id: string;
  state: PauseState;
  source: string;
  context_snapshot: Record<string, unknown> | null;
  context_fingerprint: string;
  window_starts_at: string;
  window_ends_at: string;
  created_at: string;
  engaged_at: string | null;
  completed_at: string | null;
  terminal_at: string | null;
  expired_reason: PauseExpiredReason | null;
  // v_pause_full additions:
  has_breath_completed: boolean;
  has_initial_emotion_logged: boolean;
  has_shift_emotion_logged: boolean;
  has_outcome_logged: boolean;
  initial_mood: string | null;
  shift_mood: string | null;
  outcome: string | null;
  note_text: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  counted_companion_count: number;
  counted_companion_types: string[] | null;
  reflection_text: string | null;
  haiku_text: string | null;
}

export const PAUSE_STATS_DATA_QUERY_KEY = (userId: string) => ['pause-stats-data', userId] as const;

const STALE_MS = 2 * 60_000;

export interface PauseStatsQueryPayload {
  rows: PauseFullRow[];
  stepEvents: PauseStepEventRow[];
  companionEvents: PauseCompanionEventRow[];
}

export interface UsePauseStatsData {
  ready: boolean;
  rows: PauseFullRow[];
  stepEvents: PauseStepEventRow[];
  companionEvents: PauseCompanionEventRow[];
  refresh: () => Promise<void>;
}

export function usePauseStatsData(): UsePauseStatsData {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: user ? PAUSE_STATS_DATA_QUERY_KEY(user.id) : ['pause-stats-data', 'none'],
    enabled: !!user,
    staleTime: STALE_MS,
    queryFn: async (): Promise<PauseStatsQueryPayload> => {
      if (!user) {
        return { rows: [], stepEvents: [], companionEvents: [] };
      }
      if (isDemoModeActive()) {
        return buildDemoFixture(user.id);
      }
      const [{ data: rowData }, { data: stepData }, { data: companionData }] =
        await Promise.all([
          supabase
            .from('v_pause_full' as never)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(500),
          supabase
            .from('pause_step_events' as never)
            .select('pause_instance_id, step_type, payload, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2000),
          supabase
            .from('pause_companion_events' as never)
            .select(
              'pause_instance_id, companion_type, action, counts_for_pause, non_counting_reason, created_at',
            )
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2000),
        ]);

      return {
        rows: ((rowData as unknown) as PauseFullRow[]) ?? [],
        stepEvents: ((stepData as unknown) as PauseStepEventRow[]) ?? [],
        companionEvents: ((companionData as unknown) as PauseCompanionEventRow[]) ?? [],
      };
    },
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
