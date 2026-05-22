import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-flow';
import {
  buildPauseSessionStepTransitionConfig as buildDirect,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX as slideOffsetDirect,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S as durationReducedDirect,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S as durationDirect,
  PAUSE_SESSION_STEP_TRANSITION_EASE as easeDirect,
} from './step-transition';
import { pauseStepSwipeDirection as swipeDirect } from './step-swipe-direction';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';

describe('pause-session-step-transition-flow', () => {
  it('re-exports step motion helpers from step-transition', () => {
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(80);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(0.35);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(0.1);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toEqual([0.25, 0.1, 0.25, 1]);

    const config = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: false,
    });
    expect(config.animate).toEqual({ opacity: 1, x: 0 });

    expect(buildPauseSessionStepTransitionConfig).toBe(buildDirect);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(slideOffsetDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(durationDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(durationReducedDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toBe(easeDirect);
  });

  it('re-exports swipe direction from step-swipe-direction', () => {
    expect(pauseStepSwipeDirection('feel', 'breathe')).toBe('forward');
    expect(pauseStepSwipeDirection('decide', 'reflect')).toBe('back');
    expect(pauseStepSwipeDirection).toBe(swipeDirect);
  });

  it('sibling cluster: step-handlers-flow exports stay distinct from step-transition umbrella exports', () => {
    // Full cross-flow pins: `pause-session-step-handlers-step-transition-flow-sibling-parity.test.ts`.
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepShellBundle);
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepShellBundle);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).not.toBe(buildPauseSessionStepRitualBundle);
  });
});
