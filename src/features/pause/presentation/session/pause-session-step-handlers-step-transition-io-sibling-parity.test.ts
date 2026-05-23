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
import * as handlersIo from './pause-session-step-handlers-io';
import * as transitionIo from './pause-session-step-transition-io';

/**
 * Presentation sibling parity: step-handlers-io vs step-transition-io (parity with
 * application `pause-session-step-handlers-step-transition-flow-sibling-parity.test.ts`).
 */
describe('pause-session-step-handlers-io ↔ pause-session-step-transition-io sibling parity', () => {
  it('step-handlers-io and step-transition-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(typeof buildPauseSessionStepTransitionConfig).toBe('function');
    expect(typeof pauseStepSwipeDirection).toBe('function');
    expect(typeof PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe('number');
    expect(typeof PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe('number');
    expect(typeof PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe('number');
    expect(Array.isArray(PAUSE_SESSION_STEP_TRANSITION_EASE)).toBe(true);

    expect('buildPauseSessionStepShellBundle' in transitionIo).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in transitionIo).toBe(false);
    expect('buildPauseSessionStepTransitionConfig' in handlersIo).toBe(false);
    expect('pauseStepSwipeDirection' in handlersIo).toBe(false);
    expect('PAUSE_SESSION_STEP_SLIDE_OFFSET_PX' in handlersIo).toBe(false);
  });

  it('step-handlers-io exports stay off Framer transition config and swipe direction', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepShellBundle).not.toBe(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX);
    expect(buildPauseSessionStepRitualBundle).not.toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_S);
  });

  it('step-transition-io exports stay off step bundle builders', () => {
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepShellBundle);
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).not.toBe(buildPauseSessionStepShellBundle);
  });
});
