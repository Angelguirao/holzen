/**
 * Presentation I/O for breath segment step targets + brief integrate advance guard.
 * Imports via `pause-session-breath-flow` CI anchor (no RPC bindings).
 */
export {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow';
