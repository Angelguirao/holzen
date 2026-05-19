import { useEffect } from 'react';

/**
 * When `AppLayout` signals a server-side pause became ready, clear the banner and
 * nudge profile refresh (no-op in Pause V2, kept for API parity).
 */
export function useHomeOutletPauseReady(
  pauseReady: boolean,
  hasOpenPause: boolean,
  dismissPauseReady?: () => void,
): void {
  useEffect(() => {
    if (!pauseReady || !hasOpenPause) return;
    dismissPauseReady?.();
  }, [pauseReady, hasOpenPause, dismissPauseReady]);
}
