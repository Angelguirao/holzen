/** Horizontal slide distance (px) for Framer step-change animations (not a user swipe gesture). */
export const PAUSE_SESSION_STEP_SLIDE_OFFSET_PX = 80;

/** Framer `transition.duration` (seconds) when full motion is allowed. */
export const PAUSE_SESSION_STEP_TRANSITION_DURATION_S = 0.35;

/** Framer `transition.duration` (seconds) when `prefers-reduced-motion` is on. */
export const PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S = 0.1;

/** Framer `transition.ease` cubic-bezier control points (legacy PauseSession preset). */
export const PAUSE_SESSION_STEP_TRANSITION_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export type PauseSessionSwipeDirection = 'forward' | 'back';

export type PauseSessionStepTransitionConfig = {
  initial: { opacity: number; x: number };
  animate: { opacity: number; x: number };
  exit: { opacity: number; x: number };
  transition: {
    duration: number;
    ease: [number, number, number, number];
  };
};

/**
 * Slide props for brief/deep step `motion.div` wrappers in `PauseSession`.
 * `swipeDirection` only picks animation direction when the route advances steps programmatically;
 * there is no horizontal swipe-to-navigate on `/pause`.
 */
export function buildPauseSessionStepTransitionConfig(params: {
  swipeDirection: PauseSessionSwipeDirection;
  prefersReducedMotion: boolean;
}): PauseSessionStepTransitionConfig {
  const slideX = params.prefersReducedMotion ? 0 : PAUSE_SESSION_STEP_SLIDE_OFFSET_PX;
  const forwardSign = params.swipeDirection === 'forward' ? 1 : -1;
  return {
    initial: { opacity: 0, x: slideX === 0 ? 0 : forwardSign * slideX },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: slideX === 0 ? 0 : -forwardSign * slideX },
    transition: {
      duration: params.prefersReducedMotion
        ? PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S
        : PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
      ease: PAUSE_SESSION_STEP_TRANSITION_EASE,
    },
  };
}
