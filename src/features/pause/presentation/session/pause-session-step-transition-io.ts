/**
 * Presentation I/O for `/pause` Framer step-panel motion.
 * Session conductors import here instead of `pause-session-shell-io` or deep `application/use-cases/*`.
 */
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  pauseStepSwipeDirection,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from '@/features/pause/application/use-cases/session/pause-session-step-transition-flow';
