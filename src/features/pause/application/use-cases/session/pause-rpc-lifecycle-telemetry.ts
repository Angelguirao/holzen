import { trackEvent } from '@/lib/posthog';

/** Dedupe PostHog pause lifecycle events (RPC can return the same state repeatedly). */
const phPauseEngagedSent = new Set<string>();
const phPauseCompletedSent = new Set<string>();

/** @internal Vitest-only — clears in-tab dedupe sets between cases. */
export function resetPauseRpcLifecycleTelemetryDedupeForTests(): void {
  phPauseEngagedSent.clear();
  phPauseCompletedSent.clear();
}

/** `pause_log_step` → `engaged` (first time per instance in-tab; taxonomy: pause_engaged). */
export function trackPauseEngagedOnce(pauseInstanceId: string): void {
  if (phPauseEngagedSent.has(pauseInstanceId)) return;
  phPauseEngagedSent.add(pauseInstanceId);
  try {
    trackEvent('pause_engaged', { pause_instance_id: pauseInstanceId });
  } catch {
    /* no-op */
  }
}

/** `pause_log_step` / `pause_log_companion` → `completed` (first time per instance in-tab). */
export function trackPauseCompletedOnce(pauseInstanceId: string): boolean {
  if (phPauseCompletedSent.has(pauseInstanceId)) return false;
  phPauseCompletedSent.add(pauseInstanceId);
  try {
    trackEvent('pause_completed', { pause_instance_id: pauseInstanceId });
  } catch {
    /* no-op */
  }
  return true;
}

export function trackPauseCompanionCounted(params: {
  pauseInstanceId: string;
  companionType: string;
  entryPoint: string;
}): void {
  try {
    trackEvent('pause_companion_counted', {
      pause_instance_id: params.pauseInstanceId,
      companion_type: params.companionType,
      entry_point: params.entryPoint,
    });
  } catch {
    /* no-op */
  }
}

export function trackPauseCompanionNotCounted(params: {
  pauseInstanceId?: string;
  companionType: string;
  reason: string;
  entryPoint: string;
}): void {
  try {
    trackEvent('pause_companion_not_counted', {
      ...(params.pauseInstanceId ? { pause_instance_id: params.pauseInstanceId } : {}),
      companion_type: params.companionType,
      reason: params.reason,
      entry_point: params.entryPoint,
    });
  } catch {
    /* no-op */
  }
}
