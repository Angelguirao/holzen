import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';
import {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-flow';
import * as handlersFlow from './pause-session-step-handlers-flow';
import * as transitionFlow from './pause-session-step-transition-flow';

/**
 * Dedicated sibling parity: step-handlers-flow vs step-transition-flow (complements
 * inline pins in `pause-session-step-handlers-flow.test.ts` and
 * `pause-session-step-transition-flow.test.ts`).
 */
describe('pause-session-step-handlers-flow ↔ pause-session-step-transition-flow sibling parity', () => {
  it('step-handlers-flow and step-transition-flow are distinct sibling CI anchors', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(typeof buildPauseSessionStepTransitionConfig).toBe('function');
    expect(typeof pauseStepSwipeDirection).toBe('function');
    expect(typeof PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe('number');
    expect(typeof PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe('number');
    expect(typeof PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe('number');
    expect(Array.isArray(PAUSE_SESSION_STEP_TRANSITION_EASE)).toBe(true);

    expect('buildPauseSessionStepShellBundle' in transitionFlow).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in transitionFlow).toBe(false);
    expect('buildPauseSessionStepTransitionConfig' in handlersFlow).toBe(false);
    expect('pauseStepSwipeDirection' in handlersFlow).toBe(false);
    expect('PAUSE_SESSION_STEP_SLIDE_OFFSET_PX' in handlersFlow).toBe(false);
  });

  it('step-handlers umbrella exports stay off Framer transition config and swipe direction', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepShellBundle).not.toBe(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX);
    expect(buildPauseSessionStepRitualBundle).not.toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_S);
  });

  it('step-transition umbrella exports stay off step bundle builders', () => {
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepShellBundle);
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).not.toBe(buildPauseSessionStepShellBundle);
  });
});
