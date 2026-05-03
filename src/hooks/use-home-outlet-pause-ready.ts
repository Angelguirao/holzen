import { useEffect } from 'react';

/**
 * When `AppLayout` signals a server-side pause became ready, clear the banner and
 * nudge profile refresh (no-op in Pause V2, kept for API parity).
 */
export function useHomeOutletPauseReady(
  pauseReady: boolean,
  message: string | null,
  loading: boolean,
  refreshProfile: () => void | Promise<void>,
  dismissPauseReady?: () => void,
): void {
  useEffect(() => {
    if (!pauseReady || message || loading) return;
    void refreshProfile();
    dismissPauseReady?.();
  }, [pauseReady, message, loading, refreshProfile, dismissPauseReady]);
}
