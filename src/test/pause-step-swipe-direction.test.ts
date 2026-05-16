import { describe, expect, it } from 'vitest';
import { pauseStepSwipeDirection } from '@/lib/pause-step-swipe-direction';

describe('pauseStepSwipeDirection', () => {
  it('is forward when advancing along STEPS', () => {
    expect(pauseStepSwipeDirection('feel', 'breathe')).toBe('forward');
    expect(pauseStepSwipeDirection('breath2', 'decide')).toBe('forward');
  });

  it('is forward when staying on the same step', () => {
    expect(pauseStepSwipeDirection('reflect', 'reflect')).toBe('forward');
  });

  it('is back when moving to an earlier step', () => {
    expect(pauseStepSwipeDirection('decide', 'feel')).toBe('back');
    expect(pauseStepSwipeDirection('breathe', 'feel')).toBe('back');
  });
});
