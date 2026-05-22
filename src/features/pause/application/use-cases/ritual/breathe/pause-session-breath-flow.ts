/**
 * CI cluster anchor for session breath segment RPC + timed breathing (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-breath-cluster.ts` (empty export; unit-tested).
 * Re-exports restored breath state, phase advance, segment log, and navigation constants from sibling modules.
 * Presentation: `pause-session-breath-io` imports leaf modules directly (not this umbrella).
 */
export { initialBreathSegmentRpcLoggedFlagsFromRestored } from '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags';
export {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from './restored-breath-ritual-state';
export {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceResult,
  type BreathingTimedLoopState,
} from './phase-advance';
export {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from '@/features/pause/domain/ritual/breathe/pause-breath-step-navigation';
export {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type BreathSegmentLogDeps,
} from './run-breath-segment-log';
