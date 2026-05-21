import { trackEvent } from '@/lib/posthog';

/** User confirms switching to the queued pending pause (taxonomy: pause_pending_adopted). */
export function trackPausePendingAdopted(pauseInstanceId: string): void {
  try {
    trackEvent('pause_pending_adopted', { pause_instance_id: pauseInstanceId });
  } catch {
    /* no-op */
  }
}

/** User keeps the current pause and declines the pending offer (taxonomy: pause_pending_declined). */
export function trackPausePendingDeclined(pauseInstanceId: string): void {
  try {
    trackEvent('pause_pending_declined', { pause_instance_id: pauseInstanceId });
  } catch {
    /* no-op */
  }
}
