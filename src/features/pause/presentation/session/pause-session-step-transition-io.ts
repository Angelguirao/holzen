/**
 * Presentation I/O for `/pause` Framer step-panel motion.
 * Imports session step-transition leaf modules directly (parity with ritual done I/O peels).
 * Parity pins: `pause-session-step-transition-io-parity.test.ts`, `pause-session-step-transition-io.re-exports.test.ts`,
 * `pause-session-step-transition-io.test.ts`, `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts` ↔ `pause-session-step-handlers-io`;
 * reciprocal inline pins: `pause-session-step-transition-io.test.ts` ↔ `pause-session-step-handlers-io.test.ts`.
 */
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from '@/features/pause/application/use-cases/session/step-transition';
export { pauseStepSwipeDirection } from '@/features/pause/application/use-cases/session/step-swipe-direction';
