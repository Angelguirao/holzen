import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import { fetchOpenPauseHomePreview } from '@/features/pause/public-queries';
import { pauseDismissOpenPauseHomePreview } from './pause-home-reflect-io';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import { usePauseInstancesRealtime } from '@/features/pause/presentation/realtime/use-pause-instances-realtime';

/**
 * Home open-pause preview from `v_pause_current` + reflection/companion artifacts.
 * Hydrates on login and resyncs on `pause_instances` realtime (cron / complete / dismiss).
 */
export function useOpenPauseHomePreview(user: User | null) {
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>(DEFAULT_COMPANIONS);
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
    setCompanions(DEFAULT_COMPANIONS);
    clearPausePersistedTabSession();
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

  usePauseInstancesRealtime(
    user?.id,
    user ? `holzen-open-pause-${user.id}` : 'holzen-open-pause-none',
    () => {
      void syncOpenPauseFromDb();
    },
  );

  const dismissOpenPauseHomePreviewAction = useCallback(async () => {
    await pauseDismissOpenPauseHomePreview({
      hasUser: !!user,
      clearPreview: clearOpenPausePreview,
    });
  }, [user, clearOpenPausePreview]);

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
    dismissOpenPauseHome: dismissOpenPauseHomePreviewAction,
    syncOpenPauseFromDb,
  };
}
