import { trackEvent } from '../telemetry/pause-reflect-product-telemetry';

/** User leaves an in-progress pause before completion (taxonomy: pause_session_abandoned). */
export function trackPauseSessionAbandoned(pauseInstanceId: string | undefined): void {
  try {
    trackEvent('pause_session_abandoned', {
      pause_instance_id: pauseInstanceId,
    });
  } catch {
    /* no-op */
  }
}
