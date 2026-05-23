import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';

/** True when manual trigger opened a session that is safe to auto-navigate to `/pause`. */
export function shouldNavigateAfterManualTrigger(result: ManualPauseTriggerResult): boolean {
  return Boolean(result.opened && !result.pendingOffer && result.instanceId);
}
