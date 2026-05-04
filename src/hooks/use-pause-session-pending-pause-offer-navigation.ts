import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearSession } from '@/lib/pause-session-storage';

/** Props fragment for `PendingPauseOfferShell` on `/pause` (resync + hard reset to new instance). */
export function usePauseSessionPendingPauseOfferNavigation(input: {
  navigate: NavigateFunction;
  resyncOpenPauseFromDb: () => void | Promise<void>;
}): {
  onAfterMutation: () => void;
  navigateAfterAdopt: (instanceId: string) => void;
} {
  const { navigate, resyncOpenPauseFromDb } = input;

  const onAfterMutation = useCallback(() => {
    void resyncOpenPauseFromDb();
  }, [resyncOpenPauseFromDb]);

  const navigateAfterAdopt = useCallback(
    (instanceId: string) => {
      clearSession();
      navigate('/pause', { state: { pauseInstanceId: instanceId }, replace: true });
    },
    [navigate],
  );

  return { onAfterMutation, navigateAfterAdopt };
}
