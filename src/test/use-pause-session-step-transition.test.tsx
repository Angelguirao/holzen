import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePauseSessionStepTransition } from '@/hooks/use-pause-session-step-transition';

type Props = { swipeDirection: 'forward' | 'back'; prm: boolean | null };

describe('usePauseSessionStepTransition', () => {
  it('returns the same object reference when deps are unchanged', () => {
    const { result, rerender } = renderHook(
      (p: Props) =>
        usePauseSessionStepTransition({
          swipeDirection: p.swipeDirection,
          prefersReducedMotion: p.prm,
        }),
      { initialProps: { swipeDirection: 'forward', prm: false } satisfies Props },
    );
    const first = result.current;
    rerender({ swipeDirection: 'forward', prm: false });
    expect(result.current).toBe(first);
  });

  it('returns a new reference when swipeDirection changes', () => {
    const { result, rerender } = renderHook(
      (p: Props) =>
        usePauseSessionStepTransition({
          swipeDirection: p.swipeDirection,
          prefersReducedMotion: p.prm,
        }),
      { initialProps: { swipeDirection: 'forward', prm: false } satisfies Props },
    );
    const first = result.current;
    rerender({ swipeDirection: 'back', prm: false });
    expect(result.current).not.toBe(first);
  });

  it('returns a new reference when prefersReducedMotion changes', () => {
    const { result, rerender } = renderHook(
      (p: Props) =>
        usePauseSessionStepTransition({
          swipeDirection: p.swipeDirection,
          prefersReducedMotion: p.prm,
        }),
      { initialProps: { swipeDirection: 'forward', prm: false } satisfies Props },
    );
    const first = result.current;
    rerender({ swipeDirection: 'forward', prm: true });
    expect(result.current).not.toBe(first);
  });
});
