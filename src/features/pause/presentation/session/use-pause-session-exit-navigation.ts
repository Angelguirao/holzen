import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearPersistedTabSession } from '@/features/pause/application/use-cases/session/persisted-tab-session';
import { persistedTabSessionStorage } from '@/features/pause/public-rpc';

/** Leave `/pause` without vs with clearing persisted session snapshot. */
export function usePauseSessionExitNavigation(navigate: NavigateFunction): {
  handleClose: () => void;
  handleReturn: () => void;
} {
  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleReturn = useCallback(() => {
    clearPersistedTabSession(persistedTabSessionStorage);
    navigate('/', { replace: true });
  }, [navigate]);

  return { handleClose, handleReturn };
}
