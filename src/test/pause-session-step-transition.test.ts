import { describe, expect, it } from 'vitest';
import { buildPauseSessionStepTransitionConfig } from '@/lib/pause-session-step-transition';

describe('buildPauseSessionStepTransitionConfig', () => {
  it('uses full slide distance when motion is allowed', () => {
    const fwd = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'forward',
      prefersReducedMotion: false,
    });
    expect(fwd.initial).toEqual({ opacity: 0, x: 80 });
    expect(fwd.exit).toEqual({ opacity: 0, x: -80 });
    expect(fwd.transition.duration).toBe(0.35);
  });

  it('inverts slide for back navigation', () => {
    const back = buildPauseSessionStepTransitionConfig({
      swipeDirection: 'back',
      prefersReducedMotion: false,
    });
    expect(back.initial).toEqual({ opacity: 0, x: -80 });
    expect(back.exit).toEqual({ opacity: 0, x: 80 });
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
