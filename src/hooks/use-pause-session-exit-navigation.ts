import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearSession } from '@/features/pause/public';

/** Leave `/pause` without vs with clearing persisted session snapshot. */
export function usePauseSessionExitNavigation(navigate: NavigateFunction): {
  handleClose: () => void;
  handleReturn: () => void;
} {
  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleReturn = useCallback(() => {
    clearSession();
    navigate('/', { replace: true });
  }, [navigate]);

  return { handleClose, handleReturn };
}
