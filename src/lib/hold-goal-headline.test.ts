import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeHoldGoalCompactHeadline } from '@/features/user/application/hold-goal-headline';

describe('computeHoldGoalCompactHeadline', () => {
  const t = (key: string, opts?: Record<string, unknown>) => {
    if (key === 'holdGoal.forever') return 'Forever';
    if (key === 'holdGoal.andCounting') return 'and counting';
    if (key === 'holdGoal.time') return 'Time';
    if (key === 'holdGoal.price') return 'Price';
    if (key === 'holdGoal.goalReached') return 'Done';
    if (key === 'holdGoal.daysToGo') return `${opts?.count} to go`;
    if (key === 'holdGoal.targetReached') return 'Reached';
    if (key === 'holdGoal.toGo') return 'to go';
    return key;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats forever goal with day count', () => {
    const start = new Date('2026-05-01T12:00:00Z').toISOString();
    const h = computeHoldGoalCompactHeadline(
      { type: 'forever', start, currency: 'USD' },
      { t },
    );
    expect(h).toBe('Forever · 1 day and counting');
  });

  it('formats time goal with days to go', () => {
    const start = new Date('2026-04-02T12:00:00Z').toISOString();
    const h = computeHoldGoalCompactHeadline(
      { type: 'time', start, targetMonths: 2, currency: 'USD' },
      { t },
    );
    expect(h).toMatch(/^Time · \d+ to go$/);
  });
});
