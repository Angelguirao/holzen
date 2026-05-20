import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';

/**
 * PostHog + `[holzen:companion]` console metrics for intervention idempotency:
 *
 * - `intervention_idempotency_skip` — marker already set
 * - `intervention_idempotency_dedup` — concurrent caller joined in-flight Promise
 * - `intervention_idempotency_storage_error` / `intervention_idempotency_fallback_used`
 * - `intervention_first_call_latency` — first real invocation latency per pause instance
 */
export function emitInterventionIdempotencyMetric(
  event: string,
  props: Record<string, unknown>,
): void {
  try {
    trackEvent(event, props);
  } catch {
    /* posthog itself swallows errors — belt-and-suspenders */
  }
  try {
    holzenLog.companion(event, props);
  } catch {
    /* ignore */
  }
}
