import { useCallback } from 'react';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';

/** Pull-to-refresh that performs a full page reload (Home dashboard). */
export function useHomePullFullReload() {
  const onRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  return usePullToRefresh({ onRefresh });
}
