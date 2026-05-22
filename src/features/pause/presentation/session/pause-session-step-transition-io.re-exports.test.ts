import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepTransitionConfig as buildConfigFromFlow,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX as slideOffsetFromFlow,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S as durationReducedFromFlow,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S as durationFromFlow,
  PAUSE_SESSION_STEP_TRANSITION_EASE as easeFromFlow,
  pauseStepSwipeDirection as swipeFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-step-transition-flow';
import {
  buildPauseSessionStepTransitionConfig as buildDirect,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX as slideOffsetDirect,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S as durationReducedDirect,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S as durationDirect,
  PAUSE_SESSION_STEP_TRANSITION_EASE as easeDirect,
} from '@/features/pause/application/use-cases/session/step-transition';
import { pauseStepSwipeDirection as swipeDirect } from '@/features/pause/application/use-cases/session/step-swipe-direction';

import {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-io';

describe('pause-session-step-transition-io re-exports', () => {
  it('re-exports step motion helpers with identity binding to session leaf modules', () => {
    expect(buildPauseSessionStepTransitionConfig).toBe(buildDirect);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(slideOffsetDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(durationDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(durationReducedDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toBe(easeDirect);
    expect(pauseStepSwipeDirection).toBe(swipeDirect);
  });

  it('presentation I/O bindings match pause-session-step-transition-flow CI anchor (leaf parity)', () => {
    expect(buildPauseSessionStepTransitionConfig).toBe(buildConfigFromFlow);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(slideOffsetFromFlow);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(durationFromFlow);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(durationReducedFromFlow);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toBe(easeFromFlow);
    expect(pauseStepSwipeDirection).toBe(swipeFromFlow);
  });

  it('step transition config export remains callable (smoke)', () => {
    const config = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: false,
    });
    expect(config.animate).toEqual({ opacity: 1, x: 0 });
    expect(pauseStepSwipeDirection('decide', 'reflect')).toBe('back');
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io.re-exports.test.ts` (motion vs bundle re-exports).
   * Dedicated sibling file: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-handlers-io re-exports stay distinct from step-transition-io re-exports', () => {
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepShellBundle);
    expect(buildPauseSessionStepTransitionConfig).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseStepSwipeDirection).not.toBe(buildPauseSessionStepRitualBundle);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).not.toBe(buildPauseSessionStepRitualBundle);
    // Reciprocal inline pins: `pause-session-step-handlers-io.re-exports.test.ts`.
  });
});
