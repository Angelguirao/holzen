/** Subset of `RunBreathSegmentLogResult` used by breath RPC logger hooks. */
export type BreathSegmentLogHookOutcome =
  | { status: 'success'; markSegmentLogged: true }
  | { status: 'already_logged' }
  | { status: 'no_instance' }
  | { status: 'sync_failed' };

/** Maps breath-segment use-case result to hook boolean + ref update. */
export function applyBreathSegmentLogOutcome(
  outcome: BreathSegmentLogHookOutcome,
  segmentLoggedRef: { current: boolean },
): boolean {
  if (outcome.status === 'sync_failed') return false;
  if (outcome.status === 'success' && outcome.markSegmentLogged) {
    segmentLoggedRef.current = true;
  }
  return true;
}
