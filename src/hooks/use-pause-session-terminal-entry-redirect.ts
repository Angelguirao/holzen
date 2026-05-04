import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { PauseState } from '@/lib/pause-state';
import type { FetchedPauseInstance, PersistedSession } from '@/lib/pause-session-storage';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
} from '@/lib/pause-terminal-entry-guard';

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
  const nonceRef = useRef(0);
  const toastOnceRef = useRef<string | null>(null);

  useEffect(() => {
    nonceRef.current += 1;
    const nonce = nonceRef.current;

    if (!pauseInstanceId || !shellReady) return;
    if (waitingForFetch || fetchFailed) return;
    if (persistedPauseSessionAllowsTerminalEntry(restored, pauseInstanceId)) return;

    let cancelled = false;

    void (async () => {
      let st: PauseState | string | null | undefined =
        fetchPauseInstanceId === pauseInstanceId ? fetchedInstance?.db_state : undefined;

      if (st == null) {
        const { data, error } = await supabase
          .from('pause_instances' as never)
          .select('state')
          .eq('id', pauseInstanceId)
          .maybeSingle();
        if (cancelled || nonce !== nonceRef.current || error) return;
        st = (data as { state?: PauseState } | null)?.state;
      }

      if (cancelled || nonce !== nonceRef.current || !isTerminalPauseDbState(st)) return;

      if (toastOnceRef.current !== pauseInstanceId) {
        toastOnceRef.current = pauseInstanceId;
        toast.message(
          t('pause.terminalEntryRedirect', {
            defaultValue: 'This pause already ended — opening your archive.',
          }),
        );
      }
      navigate('/archive?seg=pauses', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pauseInstanceId,
    shellReady,
    waitingForFetch,
    fetchFailed,
    fetchPauseInstanceId,
    fetchedInstance?.db_state,
    restored,
    navigate,
    t,
  ]);
}
