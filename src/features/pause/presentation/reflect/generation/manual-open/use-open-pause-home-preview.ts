import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import { runPauseDismissCurrent } from '@/features/pause/application/use-cases/session/run-pause-dismiss-current';
import { fetchOpenPauseHomePreview } from '@/features/pause/public-queries';
import { pendingPauseOfferQueryKey } from '@/features/pause/infrastructure/queries/reflect/pending-offer/pending-pause-offer-query-key';
import { HOLZEN_MARKET_DISPLAY_QUERY_PREFIX } from '@/features/market/application/queries/holzen-market-display-keys';
import { notificationsInboxQueryKey } from '@/features/notifications/infrastructure/queries/notifications-inbox-query';
import { HOLZEN_NUMBER_QUERY_KEY, PROFILE_QUERY_KEY } from '@/features/user/public-queries';
import {
  pauseDismissOpenPauseHomePreview,
  pauseHomeManualOpenPorts,
} from './pause-home-reflect-io';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import { usePauseInstancesRealtime } from '@/features/pause/presentation/realtime/use-pause-instances-realtime';
import {
  captureOpenPauseHomePreviewSnapshot,
  restoreOpenPauseHomePreviewSnapshot,
  type OpenPauseHomePreviewSnapshot,
} from '@/features/pause/presentation/home/open-pause-home-preview-snapshot';

export type UseOpenPauseHomePreviewOptions = {
  /** Fires after a debounced realtime resync when the open pause row id changed (cron / replace). */
  onOpenPauseInstanceChanged?: () => void;
};

/**
 * Home open-pause preview from `v_pause_current` + reflection/companion artifacts.
 * Hydrates on login and resyncs on `pause_instances` realtime (cron / complete / dismiss).
 */
export function useOpenPauseHomePreview(
  user: User | null,
  options: UseOpenPauseHomePreviewOptions = {},
) {
  const { onOpenPauseInstanceChanged } = options;
  const queryClient = useQueryClient();
  const lastSyncedInstanceIdRef = useRef<string | null>(null);
  const initialSyncDoneRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionData>(DEFAULT_COMPANIONS);
  const [lastPauseInstanceId, setLastPauseInstanceId] = useState<string | null>(null);
  /** From `v_pause_current.state` — `active` vs `engaged` for Home CTA copy. */
  const [openPauseState, setOpenPauseState] = useState<'active' | 'engaged' | null>(null);
  const [openPauseSource, setOpenPauseSource] = useState<string | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<Record<string, unknown> | null>(null);
  const [hasReflectionStep, setHasReflectionStep] = useState(false);
  const [hasOpenPauseStepEvents, setHasOpenPauseStepEvents] = useState(false);
  const [hasReachedReflect, setHasReachedReflect] = useState(false);
  const [isBriefRitual, setIsBriefRitual] = useState(false);
  const [openPauseCreatedAt, setOpenPauseCreatedAt] = useState<string | null>(null);

  const clearOpenPausePreview = useCallback(() => {
    setLastPauseInstanceId(null);
    setOpenPauseState(null);
    setOpenPauseSource(null);
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
    async (signal?: AbortSignal): Promise<boolean> => {
      const dead = () => signal?.aborted ?? false;
      if (!user) {
        clearOpenPausePreview();
        lastSyncedInstanceIdRef.current = null;
        initialSyncDoneRef.current = false;
        return false;
      }
      const preview = await fetchOpenPauseHomePreview(user.id);

      if (dead()) return false;

      const previousId = lastSyncedInstanceIdRef.current;
      const afterInitialSync = initialSyncDoneRef.current;

      if (!preview) {
        const hadOpenPause = previousId !== null;
        clearOpenPausePreview();
        lastSyncedInstanceIdRef.current = null;
        initialSyncDoneRef.current = true;
        return afterInitialSync && hadOpenPause;
      }

      const instanceChanged =
        afterInitialSync && preview.pauseInstanceId !== previousId;
      lastSyncedInstanceIdRef.current = preview.pauseInstanceId;
      initialSyncDoneRef.current = true;

      setLastPauseInstanceId(preview.pauseInstanceId);
      setOpenPauseState(preview.openPauseState);
      setOpenPauseSource(preview.openPauseSource);
      setOpenPauseCreatedAt(preview.createdAt);
      setContext(preview.contextText);
      setContextSnapshot(preview.contextSnapshot);
      setMessage(preview.reflectionMessage);
      setHasReflectionStep(preview.hasReflectionStep);
      setHasOpenPauseStepEvents(preview.hasOpenPauseStepEvents);
      setHasReachedReflect(preview.hasReachedReflect);
      setIsBriefRitual(preview.isBriefRitual);
      setCompanions(preview.companions);
      return instanceChanged;
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
        void queryClient.invalidateQueries({ queryKey: HOLZEN_NUMBER_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: ['home-recent-context-lost', user.id] });
        void queryClient.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(user.id) });
        void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(user.id) });
        void queryClient.invalidateQueries({ queryKey: HOLZEN_MARKET_DISPLAY_QUERY_PREFIX });
        void queryClient.invalidateQueries({ queryKey: notificationsInboxQueryKey(user.id) });
      }
      void syncOpenPauseFromDb().then((instanceChanged) => {
        if (instanceChanged) {
          onOpenPauseInstanceChanged?.();
        }
      });
    },
  );

  const dismissOpenPauseHomePreviewAction = useCallback(async () => {
    await pauseDismissOpenPauseHomePreview({
      hasUser: !!user,
      clearPreview: clearOpenPausePreview,
    });
  }, [user, clearOpenPausePreview]);

  const capturePreviewSnapshot = useCallback((): OpenPauseHomePreviewSnapshot => {
    return captureOpenPauseHomePreviewSnapshot({
      message,
      context,
      companions,
      lastPauseInstanceId,
      openPauseState,
      openPauseSource,
      contextSnapshot,
      hasReflectionStep,
      hasOpenPauseStepEvents,
      hasReachedReflect,
      isBriefRitual,
      openPauseCreatedAt,
    });
  }, [
    message,
    context,
    companions,
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    contextSnapshot,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    hasReachedReflect,
    isBriefRitual,
    openPauseCreatedAt,
  ]);

  const restorePreviewSnapshot = useCallback((snapshot: OpenPauseHomePreviewSnapshot) => {
    restoreOpenPauseHomePreviewSnapshot(snapshot, (preview) => {
      setLastPauseInstanceId(preview.lastPauseInstanceId);
      setOpenPauseState(preview.openPauseState);
      setOpenPauseSource(preview.openPauseSource);
      setMessage(preview.message);
      setContext(preview.context);
      setCompanions(preview.companions);
      setContextSnapshot(preview.contextSnapshot);
      setHasReflectionStep(preview.hasReflectionStep);
      setHasOpenPauseStepEvents(preview.hasOpenPauseStepEvents);
      setHasReachedReflect(preview.hasReachedReflect);
      setIsBriefRitual(preview.isBriefRitual);
      setOpenPauseCreatedAt(preview.openPauseCreatedAt);
      lastSyncedInstanceIdRef.current = preview.lastPauseInstanceId;
    });
  }, []);

  const commitOpenPauseDismissRpc = useCallback(async () => {
    if (!user) return;
    try {
      await runPauseDismissCurrent(pauseHomeManualOpenPorts.repository);
    } catch {
      /* non-fatal — preview already cleared locally */
    }
  }, [user]);

  return {
    message,
    context,
    companions,
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
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
    setOpenPauseSource,
    setContextSnapshot,
    setHasReflectionStep,
    setHasReachedReflect,
    setIsBriefRitual,
    setOpenPauseCreatedAt,
    clearOpenPausePreview,
    dismissOpenPauseHome: dismissOpenPauseHomePreviewAction,
    capturePreviewSnapshot,
    restorePreviewSnapshot,
    commitOpenPauseDismissRpc,
    syncOpenPauseFromDb,
  };
}
