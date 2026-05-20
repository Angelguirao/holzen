import { trackEvent } from '@/lib/posthog';

export type PauseDismissAnalyticsSurface = 'home_zen_reflection' | 'home_your_pause_widget';

export type OpenPauseStateForAnalytics = 'active' | 'engaged';

/** User dismisses open pause from Home (taxonomy: pause_open_dismissed). */
export function trackPauseOpenDismissed(
  surface: PauseDismissAnalyticsSurface,
  pauseInstanceId: string | null | undefined,
): void {
  try {
    trackEvent('pause_open_dismissed', {
      surface,
      pause_instance_id: pauseInstanceId ?? undefined,
    });
  } catch {
    /* no-op */
  }
}

/** User opens /pause from the pending-context banner on Home. */
export function trackHomePendingPauseBannerPauseOpened(
  pauseInstanceId: string | null | undefined,
  openPauseState: OpenPauseStateForAnalytics | null | undefined,
): void {
  try {
    trackEvent('home.pending_pause_banner_pause_opened', {
      pause_instance_id: pauseInstanceId ?? undefined,
      open_pause_state: openPauseState ?? undefined,
    });
  } catch {
    /* no-op */
  }
}
