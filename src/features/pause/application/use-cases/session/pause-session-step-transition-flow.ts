/**
 * CI cluster anchor for Framer step-panel motion on `/pause` (§3 / check:architecture-alignment).
 * Re-exports pure helpers; presentation imports via `pause-session-step-transition-io.ts`.
 */
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './step-transition';
export { pauseStepSwipeDirection } from './step-swipe-direction';
