import { describe, expect, it } from 'vitest';
import { computeDeepRitualGoBackTarget } from './deep-go-back';

describe('computeDeepRitualGoBackTarget', () => {
  it('returns null on first step', () => {
    expect(computeDeepRitualGoBackTarget('feel')).toBeNull();
  });

  it('returns the prior STEPS entry', () => {
    expect(computeDeepRitualGoBackTarget('breathe')).toBe('feel');
    expect(computeDeepRitualGoBackTarget('decide')).toBe('breath2');
  });
});
