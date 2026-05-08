/**
 * Pause stats bundle: shared TanStack Query options + fetch for
 * v_pause_full + pause_step_events + pause_companion_events.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  PauseCompanionEventRow,
  PauseStepEventRow,
  PauseState,
  PauseExpiredReason,
} from '@/lib/pause-state';
import { buildDemoFixture, isDemoModeActive } from '@/lib/stats/demo-fixture';
import type { UseQueryOptions } from '@tanstack/react-query';

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
  has_breath_completed: boolean;
  has_initial_emotion_logged: boolean;
  has_shift_emotion_logged: boolean;
  has_outcome_logged: boolean;
  initial_mood: string | null;
  /** True when any `initial_emotion_logged` row marks `brief_ritual` (same predicate as `pause_evaluate_transitions`). */
  is_brief_ritual: boolean;
  /** Latest `initial_emotion_logged` payload `intensity` (1–5), when logged. */
  initial_emotion_intensity: number | null;
  shift_mood: string | null;
  /** Latest `shift_emotion_logged` payload `shift_intensity` (1–5), when logged. */
  shift_emotion_intensity: number | null;
  outcome: string | null;
  note_text: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  counted_companion_count: number;
  counted_companion_types: string[] | null;
  reflection_text: string | null;
  haiku_text: string | null;
}

export const PAUSE_STATS_DATA_STALE_MS = 2 * 60_000;

export const PAUSE_STATS_DATA_QUERY_KEY = (userId: string) =>
  ['pause-stats-data', userId] as const;

export type PauseStatsQueryPayload = {
  rows: PauseFullRow[];
  stepEvents: PauseStepEventRow[];
  companionEvents: PauseCompanionEventRow[];
};

const EMPTY_PAYLOAD: PauseStatsQueryPayload = {
  rows: [],
  stepEvents: [],
  companionEvents: [],
};

/** Parallel reads used by Stats + Badges; demo mode returns fixture data. */
export async function fetchPauseStatsData(userId: string): Promise<PauseStatsQueryPayload> {
  if (isDemoModeActive()) {
    return buildDemoFixture(userId);
  }
  const [{ data: rowData }, { data: stepData }, { data: companionData }] = await Promise.all([
    supabase
      .from('v_pause_full' as never)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('pause_step_events' as never)
      .select('pause_instance_id, step_type, payload, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase
      .from('pause_companion_events' as never)
      .select(
        'pause_instance_id, companion_type, action, counts_for_pause, non_counting_reason, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2000),
  ]);

  const rawRows = ((rowData as unknown) as PauseFullRow[]) ?? [];
  return {
    rows: rawRows.map((r) => ({
      ...r,
      is_brief_ritual: Boolean(r.is_brief_ritual),
    })),
    stepEvents: ((stepData as unknown) as PauseStepEventRow[]) ?? [],
    companionEvents: ((companionData as unknown) as PauseCompanionEventRow[]) ?? [],
  };
}

export function getPauseStatsDataQueryOptions(
  userId: string,
): Pick<
  UseQueryOptions<PauseStatsQueryPayload>,
  'queryKey' | 'staleTime' | 'queryFn'
> {
  return {
    queryKey: PAUSE_STATS_DATA_QUERY_KEY(userId),
    staleTime: PAUSE_STATS_DATA_STALE_MS,
    queryFn: () => fetchPauseStatsData(userId),
  };
}

/** Placeholder options when there is no authenticated user (query stays disabled). */
export function getPauseStatsDataDisabledQueryOptions(): Pick<
  UseQueryOptions<PauseStatsQueryPayload>,
  'queryKey' | 'staleTime' | 'queryFn'
> {
  return {
    queryKey: ['pause-stats-data', 'none'] as const,
    staleTime: PAUSE_STATS_DATA_STALE_MS,
    queryFn: async () => EMPTY_PAYLOAD,
  };
}
