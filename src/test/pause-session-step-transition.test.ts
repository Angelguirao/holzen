import { describe, expect, it } from 'vitest';
import {
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  buildPauseSessionStepTransitionConfig,
} from '@/lib/pause-session-step-transition';

describe('PAUSE_SESSION_STEP_SLIDE_OFFSET_PX', () => {
  it('matches legacy PauseSession slide distance', () => {
    expect(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX).toBe(80);
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
    expect(fwd.transition.duration).toBe(0.35);
  });

  it('inverts slide for back navigation', () => {
    const back = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'back',
      prefersReducedMotion: false,
    });
    expect(back.initial).toEqual({ opacity: 0, x: -PAUSE_SESSION_STEP_SLIDE_OFFSET_PX });
    expect(back.exit).toEqual({ opacity: 0, x: PAUSE_SESSION_STEP_SLIDE_OFFSET_PX });
  });

  it('zeros slide and shortens duration when reduced motion', () => {
    const cfg = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: true,
    });
    expect(cfg.initial.x).toBe(0);
    expect(cfg.exit.x).toBe(0);
    expect(cfg.transition.duration).toBe(0.1);
  });
});
