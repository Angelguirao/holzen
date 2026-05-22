/**
 * CI cluster anchor for Framer step-panel motion on `/pause` (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-step-transition-cluster.ts` (empty export; unit-tested).
 * Re-exports pure helpers; presentation imports leaf modules via `pause-session-step-transition-io.ts` (not this umbrella).
 * Parity pins: `pause-session-step-transition-io-parity.test.ts`, `pause-session-step-transition-io.re-exports.test.ts`.
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
