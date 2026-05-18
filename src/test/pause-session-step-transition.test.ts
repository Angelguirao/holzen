import { describe, expect, it } from 'vitest';
import {
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  buildPauseSessionStepTransitionConfig,
} from '@/features/pause/application/session/step-transition';

describe('PAUSE_SESSION_STEP_SLIDE_OFFSET_PX', () => {
  it('matches legacy PauseSession slide distance', () => {
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(80);
  });
});

describe('pause session step transition durations', () => {
  it('match legacy Framer durations on PauseSession', () => {
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_S).toBe(0.35);
    expect(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S).toBe(0.1);
  });
});

describe('PAUSE_SESSION_STEP_TRANSITION_EASE', () => {
  it('matches legacy cubic-bezier array', () => {
    expect(PAUSE_SESSION_STEP_TRANSITION_EASE).toEqual([0.25, 0.1, 0.25, 1]);
  });
});

describe('buildPauseSessionStepTransitionConfig', () => {
  it('uses full slide distance when motion is allowed', () => {
    const fwd = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: false,
    });
    expect(fwd.initial).toEqual({ opacity: 0, x: PAUSE_SESSION_STEP_SLIDE_OFFSET_PX });
    expect(fwd.exit).toEqual({ opacity: 0, x: -PAUSE_SESSION_STEP_SLIDE_OFFSET_PX });
    expect(fwd.transition.duration).toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_S);
    expect(fwd.transition.ease).toBe(PAUSE_SESSION_STEP_TRANSITION_EASE);
  });

  it('inverts slide for back navigation', () => {
    const back = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'back',
      prefersReducedMotion: false,
    });
    expect(back.initial).toEqual({ opacity: 0, x: -PAUSE_SESSION_STEP_SLIDE_OFFSET_PX });
    expect(back.exit).toEqual({ opacity: 0, x: PAUSE_SESSION_STEP_SLIDE_OFFSET_PX });
    expect(back.transition.ease).toBe(PAUSE_SESSION_STEP_TRANSITION_EASE);
  });

  it('zeros slide and shortens duration when reduced motion', () => {
    const cfg = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: true,
    });
    expect(cfg.initial.x).toBe(0);
    expect(cfg.exit.x).toBe(0);
    expect(cfg.transition.duration).toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S);
    expect(cfg.transition.ease).toBe(PAUSE_SESSION_STEP_TRANSITION_EASE);
  });
});
