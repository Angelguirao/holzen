/**
 * Presentation I/O for breath segment step targets + brief integrate advance guard.
 * Imports `domain/ritual/breathe/pause-breath-step-navigation` directly (not `pause-session-breath-flow` CI anchor).
 * Parity pins: colocated `pause-session-breath-step-navigation-io-parity.test.ts` (reciprocal ↔ breath-io parity)
 * and `pause-session-breath-step-navigation-io.re-exports.test.ts`.
 */
export {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from '@/features/pause/domain/ritual/breathe/pause-breath-step-navigation';
