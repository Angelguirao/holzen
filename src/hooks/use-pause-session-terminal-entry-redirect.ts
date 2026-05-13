import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PauseState } from '@/lib/pause-state';
import type { FetchedPauseInstance, PersistedSession } from '@/lib/pause-session-storage';
import { getPauseTerminalEntryStateQueryOptions } from '@/lib/pause-terminal-entry-state-query';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
} from '@/lib/pause-terminal-entry-guard';

export { pauseTerminalEntryStateQueryKey } from '@/lib/pause-terminal-entry-state-query';

/**
 * Blocks `/pause` when the instance is already terminal in Postgres unless the tab still has
 * local ritual storage for that same instance (user finishing after expiry, etc.).
 */
export function usePauseSessionTerminalEntryRedirect(input: {
  pauseInstanceId: string | null;
  /** Shell resolved to a ready payload (message + hydration complete enough to run ritual). */
  shellReady: boolean;
  waitingForFetch: boolean;
  fetchFailed: boolean;
  fetchPauseInstanceId: string | null;
  fetchedInstance: FetchedPauseInstance | null;
  restored: PersistedSession | null;
}): void {
  const {
    pauseInstanceId,
    shellReady,
    waitingForFetch,
    fetchFailed,
    fetchPauseInstanceId,
    fetchedInstance,
    restored,
  } = input;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toastOnceRef = useRef<string | null>(null);
  const redirectedRef = useRef<string | null>(null);

  const derivedFromFetch =
    pauseInstanceId && fetchPauseInstanceId === pauseInstanceId ? fetchedInstance?.db_state : undefined;

  const needsServerState = Boolean(
    pauseInstanceId &&
      shellReady &&
      !waitingForFetch &&
      !fetchFailed &&
      !persistedPauseSessionAllowsTerminalEntry(restored, pauseInstanceId) &&
      derivedFromFetch == null,
  );

  const { data: serverState } = useQuery(
    getPauseTerminalEntryStateQueryOptions({
      pauseInstanceId,
      enabled: needsServerState,
    }),
  );

  const resolvedDbState = useMemo((): PauseState | string | null | undefined => {
    if (!pauseInstanceId || !shellReady || waitingForFetch || fetchFailed) return undefined;
    if (persistedPauseSessionAllowsTerminalEntry(restored, pauseInstanceId)) return undefined;
    if (derivedFromFetch != null) return derivedFromFetch;
    return serverState ?? undefined;
  }, [
    pauseInstanceId,
    shellReady,
    waitingForFetch,
    fetchFailed,
    restored,
    derivedFromFetch,
    serverState,
  ]);

  useEffect(() => {
    redirectedRef.current = null;
    toastOnceRef.current = null;
  }, [pauseInstanceId]);

  useEffect(() => {
    if (!pauseInstanceId || !shellReady) return;
    if (waitingForFetch || fetchFailed) return;
    if (persistedPauseSessionAllowsTerminalEntry(restored, pauseInstanceId)) return;
    if (redirectedRef.current === pauseInstanceId) return;
    if (!isTerminalPauseDbState(resolvedDbState)) return;

    redirectedRef.current = pauseInstanceId;

    if (toastOnceRef.current !== pauseInstanceId) {
      toastOnceRef.current = pauseInstanceId;
      toast.message(
        t('pause.terminalEntryRedirect', {
          defaultValue: 'This pause already ended — opening your archive.',
        }),
      );
    }
    navigate('/archive?seg=pauses', { replace: true });
  }, [
    pauseInstanceId,
    shellReady,
    waitingForFetch,
    fetchFailed,
    restored,
    resolvedDbState,
    navigate,
    t,
  ]);
}
