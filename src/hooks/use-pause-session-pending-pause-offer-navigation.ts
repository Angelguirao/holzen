import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearSession } from '@/features/pause/infrastructure/session/persisted-session-storage';

/** After adopt on `/pause`: resync Holzen + hard navigation to the new instance (`PauseLeaveWithPendingSheet`). */
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
