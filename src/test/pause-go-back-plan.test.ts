import { describe, expect, it } from 'vitest';
import { computePauseGoBackPlan } from '@/lib/pause-go-back-plan';

describe('computePauseGoBackPlan', () => {
  it('brief: none on first macro step', () => {
    expect(computePauseGoBackPlan('brief', 'feel', 'feel')).toEqual({ kind: 'none' });
  });

  it('brief: navigates with integrate flag rules', () => {
    expect(computePauseGoBackPlan('brief', 'integrate', 'feel')).toEqual({
      kind: 'brief',
      prev: 'breath',
      clearBriefIntegrateDone: true,
    });
    expect(computePauseGoBackPlan('brief', 'decide', 'feel')).toEqual({
      kind: 'brief',
      prev: 'integrate',
      clearBriefIntegrateDone: true,
    });
  });

  it('deep: uses STEPS order for picker and deep', () => {
    expect(computePauseGoBackPlan('picker', 'feel', 'feel')).toEqual({ kind: 'none' });
    expect(computePauseGoBackPlan('picker', 'feel', 'breathe')).toEqual({ kind: 'deep', prev: 'feel' });
    expect(computePauseGoBackPlan('deep', 'feel', 'decide')).toEqual({ kind: 'deep', prev: 'choose' });
  });
});
