import { useEffect } from 'react';
import { holzenLog } from '@/lib/holzen-console';

/**
 * One-shot dev diagnostic when `/pause` mounts. Arguments are read from the **first** render only
 * (empty dependency array); matches prior inline `PauseSession` behavior.
 */
export function usePauseSessionMountLog(params: {
  pauseInstanceIdPrefix: string | null;
  hasNavMessage: boolean;
  restoredFromStorage: boolean;
  hydrationStatus: 'ready' | 'fetch' | 'empty';
}): void {
  useEffect(() => {
    holzenLog.pause('mount', {
      pauseInstanceIdPrefix: params.pauseInstanceIdPrefix,
      hasNavMessage: params.hasNavMessage,
      restoredFromStorage: params.restoredFromStorage,
      hydrationStatus: params.hydrationStatus,
    });
    // Intentional mount-only snapshot; listing deps would re-log on every navigation/hydration change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once diagnostic
  }, []);
}
