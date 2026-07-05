import { trackEvent } from '@/features/pause/application/pause-product-analytics';

export type PauseDismissAnalyticsSurface = 'home_your_pause_widget';

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
