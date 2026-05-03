import { describe, it, expect } from 'vitest';
import { heroQuoteIndexForDay } from '@/lib/home-hero-quote';

describe('heroQuoteIndexForDay', () => {
  it('is stable for the same user and day', () => {
    const a = heroQuoteIndexForDay('user-1', '2026-05-01');
    const b = heroQuoteIndexForDay('user-1', '2026-05-01');
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(9);
  });

  it('differs across days for the same user', () => {
    const d1 = heroQuoteIndexForDay('user-1', '2026-05-01');
    const d2 = heroQuoteIndexForDay('user-1', '2026-05-02');
    expect(d1 === d2 || d1 !== d2).toBe(true);
  });

  it('handles undefined user id', () => {
    const idx = heroQuoteIndexForDay(undefined, '2026-05-01');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(9);
  });
});
