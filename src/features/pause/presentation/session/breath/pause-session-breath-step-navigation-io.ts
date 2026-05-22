/**
 * Presentation I/O for breath segment step targets + brief integrate advance guard.
 * Imports `domain/ritual/breathe/pause-breath-step-navigation` directly (parity with ritual-done and segment RPC I/O peels).
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
