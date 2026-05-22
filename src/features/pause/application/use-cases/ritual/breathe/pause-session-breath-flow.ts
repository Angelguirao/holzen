/**
 * CI cluster anchor for session breath segment RPC + timed breathing (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-breath-cluster.ts` (empty export; unit-tested).
 * Re-exports restored breath state, phase advance, segment log (`pause-run-breath-segment-log-flow`), and navigation constants from sibling modules.
 * Presentation: `pause-session-breath-io` imports leaf modules directly (not this umbrella).
 * Parity pins: `pause-session-breath-io.re-exports.test.ts`, `pause-session-breath-io-parity.test.ts`,
 * and `pause-session-breath-step-navigation-io-parity.test.ts` (sibling step-navigation I/O peel).
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
} from './pause-run-breath-segment-log-flow';
