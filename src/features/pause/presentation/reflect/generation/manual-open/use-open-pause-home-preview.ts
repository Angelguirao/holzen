import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import { fetchOpenPauseHomePreview } from '@/features/pause/public-queries';
import { PROFILE_QUERY_KEY } from '@/features/user/public-queries';
import { pauseDismissOpenPauseHomePreview } from './pause-home-reflect-io';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import { usePauseInstancesRealtime } from '@/features/pause/presentation/realtime/use-pause-instances-realtime';

/**
 * Home open-pause preview from `v_pause_current` + reflection/companion artifacts.
 * Hydrates on login and resyncs on `pause_instances` realtime (cron / complete / dismiss).
 */
export function useOpenPauseHomePreview(user: User | null) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>(DEFAULT_COMPANIONS);
  const [lastPauseInstanceId, setLastPauseInstanceId] = useState<string | null>(null);
  /** From `v_pause_current.state` — `active` vs `engaged` for Home CTA copy. */
  const [openPauseState, setOpenPauseState] = useState<'active' | 'engaged' | null>(null);
  const [lastTriggerAt, setLastTriggerAt] = useState<string | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<Record<string, unknown> | null>(null);
  const [hasReflectionStep, setHasReflectionStep] = useState(false);
  const [hasOpenPauseStepEvents, setHasOpenPauseStepEvents] = useState(false);
  const [hasReachedReflect, setHasReachedReflect] = useState(false);
  const [isBriefRitual, setIsBriefRitual] = useState(false);
  const [openPauseCreatedAt, setOpenPauseCreatedAt] = useState<string | null>(null);

  const clearOpenPausePreview = useCallback(() => {
    setLastPauseInstanceId(null);
    setOpenPauseState(null);
    setLastTriggerAt(null);
    setMessage(null);
    setContext(null);
    setCompanions(DEFAULT_COMPANIONS);
    setContextSnapshot(null);
    setHasReflectionStep(false);
    setHasOpenPauseStepEvents(false);
    setHasReachedReflect(false);
    setIsBriefRitual(false);
    setOpenPauseCreatedAt(null);
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
      setOpenPauseCreatedAt(preview.createdAt);
      setContext(preview.contextText);
      setContextSnapshot(preview.contextSnapshot);
      setMessage(preview.reflectionMessage);
      setHasReflectionStep(preview.hasReflectionStep);
      setHasOpenPauseStepEvents(preview.hasOpenPauseStepEvents);
      setHasReachedReflect(preview.hasReachedReflect);
      setIsBriefRitual(preview.isBriefRitual);
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
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: ['home-recent-context-lost', user.id] });
        void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(user.id) });
      }
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
    contextSnapshot,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    hasReachedReflect,
    isBriefRitual,
    openPauseCreatedAt,
    setMessage,
    setContext,
    setCompanions,
    setLastPauseInstanceId,
    setOpenPauseState,
    setLastTriggerAt,
    setContextSnapshot,
    setHasReflectionStep,
    setHasReachedReflect,
    setIsBriefRitual,
    setOpenPauseCreatedAt,
    clearOpenPausePreview,
    dismissOpenPauseHome: dismissOpenPauseHomePreviewAction,
    syncOpenPauseFromDb,
  };
}
