import type { RunBreathSegmentLogResult } from '@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log';

/** Maps breath-segment use-case result to hook boolean + ref update. */
export function applyBreathSegmentLogOutcome(
  outcome: RunBreathSegmentLogResult,
  segmentLoggedRef: { current: boolean },
): boolean {
  if (outcome.status === 'sync_failed') return false;
  if (outcome.status === 'success' && outcome.markSegmentLogged) {
    segmentLoggedRef.current = true;
  }
  return true;
}
