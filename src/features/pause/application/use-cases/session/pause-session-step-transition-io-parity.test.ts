import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepTransitionConfig as buildConfigDirect,
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
} from '@/features/pause/application/use-cases/session/pause-session-step-transition-flow';
import {
  buildPauseSessionStepTransitionConfig as buildConfigFromStepTransitionIo,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX as slideOffsetFromStepTransitionIo,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S as durationReducedFromStepTransitionIo,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S as durationFromStepTransitionIo,
  PAUSE_SESSION_STEP_TRANSITION_EASE as easeFromStepTransitionIo,
  pauseStepSwipeDirection as swipeFromStepTransitionIo,
} from '@/features/pause/presentation/session/pause-session-step-transition-io';

describe('pause-session-step-transition-io parity', () => {
  it('presentation I/O step-transition exports match pause-session-step-transition-flow CI umbrella', () => {
    expect(buildPauseSessionStepTransitionConfig).toBe(buildConfigFromStepTransitionIo);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(slideOffsetFromStepTransitionIo);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(durationFromStepTransitionIo);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(
      durationReducedFromStepTransitionIo,
    );
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toBe(easeFromStepTransitionIo);
    expect(pauseStepSwipeDirection).toBe(swipeFromStepTransitionIo);
  });

  it('step-transition-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(buildPauseSessionStepTransitionConfig).toBe(buildConfigDirect);
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(slideOffsetDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(durationDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(durationReducedDirect);
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toBe(easeDirect);
    expect(pauseStepSwipeDirection).toBe(swipeDirect);
  });
});
