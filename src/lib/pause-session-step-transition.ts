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
 * Matches the prior inline `slideX` + `stepTransition` object.
 */
export function buildPauseSessionStepTransitionConfig(params: {
  swipeDirection: PauseSessionSwipeDirection;
  prefersReducedMotion: boolean;
}): PauseSessionStepTransitionConfig {
  const slideX = params.prefersReducedMotion ? 0 : 80;
  const forwardSign = params.swipeDirection === 'forward' ? 1 : -1;
  return {
    initial: { opacity: 0, x: slideX === 0 ? 0 : forwardSign * slideX },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: slideX === 0 ? 0 : -forwardSign * slideX },
    transition: {
      duration: params.prefersReducedMotion ? 0.1 : 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  };
}
