import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { fetchOpenPauseHomePreview } from '@/features/pause/public-queries';
import { clearSession } from '@/features/pause/public';
import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/screens/pause/components/CompanionSection';

const EMPTY_COMPANIONS: CompanionData = {
  haiku: null,
  groundingTitle: null,
  groundingBody: null,
};

/**
 * Home open-pause preview from `v_pause_current` + reflection/companion artifacts.
 * Hydrates on login and resyncs on `pause_instances` realtime (cron / complete / dismiss).
 */
export function useOpenPauseHomePreview(user: User | null) {
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>(EMPTY_COMPANIONS);
  const [lastPauseInstanceId, setLastPauseInstanceId] = useState<string | null>(null);
  /** From `v_pause_current.state` — `active` vs `engaged` for Home CTA copy. */
  const [openPauseState, setOpenPauseState] = useState<'active' | 'engaged' | null>(null);
  const [lastTriggerAt, setLastTriggerAt] = useState<string | null>(null);

  const clearOpenPausePreview = useCallback(() => {
    setLastPauseInstanceId(null);
    setOpenPauseState(null);
    setLastTriggerAt(null);
    setMessage(null);
    setContext(null);
    setCompanions(EMPTY_COMPANIONS);
    clearSession();
  }, []);

  /** Re-read v_pause_current + artifacts so Home matches Library after completes / dismissals. */
  const syncOpenPauseFromDb = useCallback(
    async (signal?: AbortSignal) => {
      const dead = () => signal?.aborted ?? false;
      if (!user) {
        clearOpenPausePreview();
        return;
      }
      const preview = await fetchOpenPauseHomePreview(user.id);

      if (dead()) return;

      if (!preview) {
        clearOpenPausePreview();
        return;
      }

      setLastPauseInstanceId(preview.pauseInstanceId);
      setOpenPauseState(preview.openPauseState);
      setLastTriggerAt(preview.createdAt);
      setContext(preview.contextText);
      setMessage(preview.reflectionMessage);
      setCompanions(preview.companions);
    },
    [user, clearOpenPausePreview],
  );

  useEffect(() => {
    const ac = new AbortController();
    void syncOpenPauseFromDb(ac.signal);
    return () => ac.abort();
  }, [syncOpenPauseFromDb]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`holzen-open-pause-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void syncOpenPauseFromDb();
        },
      )
      .subscribe();

    return () => {
      if (typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }, [user, syncOpenPauseFromDb]);

  return {
    message,
    context,
    companions,
    lastPauseInstanceId,
    openPauseState,
    lastTriggerAt,
    setMessage,
    setContext,
    setCompanions,
    setLastPauseInstanceId,
    setOpenPauseState,
    setLastTriggerAt,
    clearOpenPausePreview,
    syncOpenPauseFromDb,
  };
}
