import { useEffect, useState } from 'react';

/**
 * Breathing-room pacing primitive for companion Full View pages.
 *
 * Returns `revealed: true` after `delayMs` milliseconds. Callers wrap their
 * feedback / save CTAs so the screen doesn't ask for input before the user has
 * had a chance to read. Honors `prefers-reduced-motion`: reduced-motion users
 * get the reveal immediately (no surprise delay for accessibility users).
 */
export function useStaggeredReveal(delayMs: number): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setRevealed(true);
      return;
    }

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || delayMs <= 0) {
      setRevealed(true);
      return;
    }

    const id = window.setTimeout(() => setRevealed(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  return revealed;
}
