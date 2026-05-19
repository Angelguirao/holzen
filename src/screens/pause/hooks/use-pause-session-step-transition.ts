import { useMemo } from 'react';
import {
  buildPauseSessionStepTransitionConfig,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from '@/features/pause/public';

/**
 * Framer Motion transition props shared by pause ritual step panels.
 * Memoized so many sibling `motion.div` nodes do not receive a new object each render.
 */
export function usePauseSessionStepTransition(params: {
  swipeDirection: PauseSessionSwipeDirection;
  prefersReducedMotion: boolean | null;
}): PauseSessionStepTransitionConfig {
  const { swipeDirection, prefersReducedMotion } = params;
  return useMemo(
    () =>
      buildPauseSessionStepTransitionConfig({
        swipeDirection,
        prefersReducedMotion: !!prefersReducedMotion,
      }),
    [swipeDirection, prefersReducedMotion],
  );
}
