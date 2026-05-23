import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

/** Leave `/pause` without vs with clearing persisted session snapshot. */
export function usePauseSessionExitNavigation(navigate: NavigateFunction): {
  handleClose: () => void;
  handleReturn: () => void;
} {
  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleReturn = useCallback(() => {
    clearPausePersistedTabSession();
    navigate('/', { replace: true });
  }, [navigate]);

  return { handleClose, handleReturn };
}
