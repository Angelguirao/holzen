import { describe, expect, it } from 'vitest';
import { computeBriefPastStepClick } from '@/features/pause/public';

describe('computeBriefPastStepClick', () => {
  it('returns null when target is current or later', () => {
    expect(computeBriefPastStepClick('integrate', 'integrate')).toBeNull();
    expect(computeBriefPastStepClick('decide', 'feel')).toBeNull();
    expect(computeBriefPastStepClick('breath', 'feel')).toBeNull();
  });

  it('allows jumping to an earlier macro', () => {
    expect(computeBriefPastStepClick('feel', 'breath')).toEqual({
      target: 'feel',
      clearBriefIntegrateDone: true,
    });
    expect(computeBriefPastStepClick('breath', 'integrate')).toEqual({
      target: 'breath',
      clearBriefIntegrateDone: true,
    });
  });

  it('does not clear integrate when landing on integrate or decide', () => {
    expect(computeBriefPastStepClick('integrate', 'decide')).toEqual({
      target: 'integrate',
      clearBriefIntegrateDone: false,
    });
  });
});
