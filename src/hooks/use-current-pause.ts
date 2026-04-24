/**
 * Read the caller's single open (active|engaged) pause, if any.
 *
 * Uses `v_pause_current` under `security_invoker = true`, so RLS handles
 * ownership — we don't need to filter by user_id manually.
 *
 * Returns null when no open pause exists. Subscribes to realtime changes
 * on the underlying `pause_instances` rows so the Library card reacts
 * instantly when a new cron-fired pause arrives or the user completes /
 * dismisses one.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { PauseState } from '@/lib/pause-state';

export interface CurrentPauseRow {
  id: string;
  user_id: string;
  state: PauseState;
  source: string;
  created_at: string;
  window_ends_at: string;
  context_snapshot: Record<string, unknown> | null;
  // Optional artifact-shaped fields, present once the hook hydrates:
  reflection_message: string | null;
  haiku: string | null;
}

interface State {
  loaded: boolean;
  current: CurrentPauseRow | null;
}

export function useCurrentPause() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ loaded: false, current: null });

  const load = useCallback(async () => {
    if (!user) {
      setState({ loaded: true, current: null });
      return;
    }
    const { data, error } = await supabase
      .from('v_pause_current' as never)
      .select('id, user_id, state, source, created_at, window_ends_at, context_snapshot')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      setState({ loaded: true, current: null });
      return;
    }

    const row = data as unknown as CurrentPauseRow;

    const { data: artifacts } = await supabase
      .from('pause_ai_artifacts' as never)
      .select('kind, content')
      .eq('pause_instance_id', row.id)
      .in('kind', ['reflection_text', 'haiku']);

    let reflectionMessage: string | null = null;
    let haiku: string | null = null;
    for (const a of (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>) {
      if (a.kind === 'reflection_text') {
        const msg = a.content?.message;
        if (typeof msg === 'string') reflectionMessage = msg;
      } else if (a.kind === 'haiku') {
        const h = a.content?.haiku;
        if (typeof h === 'string') haiku = h;
      }
    }

    setState({
      loaded: true,
      current: { ...row, reflection_message: reflectionMessage, haiku },
    });
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`pause-instances-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { ...state, refresh: load };
}
