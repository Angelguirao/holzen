import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearPersistedTabSession } from '@/features/pause/application/use-cases/session/persisted-tab-session';
import { persistedTabSessionStorage } from '@/features/pause/public-rpc';

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
      clearPersistedTabSession(persistedTabSessionStorage);
      navigate('/pause', { state: { pauseInstanceId: instanceId }, replace: true });
    },
    [navigate],
  );

  return { onAfterMutation, navigateAfterAdopt };
}
