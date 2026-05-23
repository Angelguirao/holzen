import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-io';
import {
  buildPauseSessionStepTransitionConfig as buildConfigDirect,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX as slideOffsetDirect,
} from '@/features/pause/application/use-cases/session/step-transition';
import { pauseStepSwipeDirection as swipeDirect } from '@/features/pause/application/use-cases/session/step-swipe-direction';

describe('pause-session-step-transition-io', () => {
  it('re-exports step motion helpers from step-transition and step-swipe-direction', () => {
    const config = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: false,
    });
    expect(config.animate).toEqual({ opacity: 1, x: 0 });
    expect(buildPauseSessionStepTransitionConfig).toBe(buildConfigDirect);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(slideOffsetDirect);
    expect(pauseStepSwipeDirection).toBe(swipeDirect);
    expect(pauseStepSwipeDirection('decide', 'reflect')).toBe('back');
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io.test.ts` (motion I/O vs step bundles).
   * Dedicated sibling file: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-handlers-io exports stay distinct from step-transition-io', () => {
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepShellBundle);
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).not.toBe(buildPauseSessionStepShellBundle);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).not.toBe(buildPauseSessionStepShellBundle);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).not.toBe(buildPauseSessionStepShellBundle);
    // Reciprocal inline pins: `pause-session-step-handlers-io.test.ts`.
  });
});
