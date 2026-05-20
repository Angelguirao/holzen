import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStaggeredReveal } from './use-staggered-reveal';

/**
 * `useStaggeredReveal` gates breathing-room behavior on companion Full Views.
 * The contract: returns `false` immediately, flips to `true` after `delayMs`,
 * and short-circuits to `true` under `prefers-reduced-motion`. We test both
 * branches because they directly affect whether the screen feels rushed.
 */
describe('useStaggeredReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns false immediately and reveals after the delay', () => {
    mockPrefersReducedMotion(false);
    const { result } = renderHook(() => useStaggeredReveal(8000));
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(7999);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it('reveals immediately when the user prefers reduced motion', () => {
    mockPrefersReducedMotion(true);
    const { result } = renderHook(() => useStaggeredReveal(8000));
    expect(result.current).toBe(true);
  });

  it('reveals immediately when delay is 0 or negative', () => {
    mockPrefersReducedMotion(false);
    const { result } = renderHook(() => useStaggeredReveal(0));
    expect(result.current).toBe(true);
  });
});

function mockPrefersReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
