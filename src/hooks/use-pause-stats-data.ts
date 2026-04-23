/**
 * Pause V2 stats data loader.
 *
 * Reads everything Stats + Badges need from the new tables in one trip:
 *   - v_pause_full (instance rows + step presence + counted companion count
 *     + artifact text)
 *   - pause_step_events (raw events, used by mood-shift / note-depth /
 *     favorite counters that need payloads, not just presence flags)
 *   - pause_companion_events (raw events, used by Reappraisal effect
 *     calculations + Badge companion counters)
 *
 * Returns { ready, rows, stepEvents, companionEvents }. When the user has
 * no data yet or the V2 flag is off, `rows` is an empty array — callers
 * should show the same empty-state copy they use for a brand-new user.
 *
 * The hook owns caching + realtime so Stats surfaces don't re-fetch on
 * every tab switch.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { isPauseV2Enabled } from '@/lib/pause-v2-flag';
import type {
  PauseState,
  PauseStepEventRow,
  PauseCompanionEventRow,
  PauseExpiredReason,
} from '@/lib/pause-state';

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

export interface UsePauseStatsData {
  ready: boolean;
  v2Enabled: boolean;
  rows: PauseFullRow[];
  stepEvents: PauseStepEventRow[];
  companionEvents: PauseCompanionEventRow[];
  refresh: () => Promise<void>;
}

export function usePauseStatsData(): UsePauseStatsData {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [v2Enabled, setV2Enabled] = useState(false);
  const [rows, setRows] = useState<PauseFullRow[]>([]);
  const [stepEvents, setStepEvents] = useState<PauseStepEventRow[]>([]);
  const [companionEvents, setCompanionEvents] = useState<PauseCompanionEventRow[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setReady(true);
      setRows([]);
      setStepEvents([]);
      setCompanionEvents([]);
      return;
    }
    const enabled = await isPauseV2Enabled();
    setV2Enabled(enabled);
    if (!enabled) {
      setReady(true);
      setRows([]);
      setStepEvents([]);
      setCompanionEvents([]);
      return;
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

    setRows(((rowData as unknown) as PauseFullRow[]) ?? []);
    setStepEvents(((stepData as unknown) as PauseStepEventRow[]) ?? []);
    setCompanionEvents(((companionData as unknown) as PauseCompanionEventRow[]) ?? []);
    setReady(true);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ready,
    v2Enabled,
    rows,
    stepEvents,
    companionEvents,
    refresh: load,
  };
}
