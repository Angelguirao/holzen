import { describe, expect, it } from 'vitest';
import {
  PAUSE_OPEN_MAX_AGE_MS,
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
} from '@/lib/pause-open-max-countdown';

describe('pauseOpenMaxDeadlineMs', () => {
  it('sets the deadline exactly 12 hours after the engagement timestamp', () => {
    const engagedAt = '2026-05-04T10:15:30.000Z';

    expect(pauseOpenMaxDeadlineMs(engagedAt)).toBe(
      new Date(engagedAt).getTime() + PAUSE_OPEN_MAX_AGE_MS,
    );
  });
});

describe('formatPauseOpenMaxRemaining', () => {
  it('formats hour and minute precision while flooring partial minutes', () => {
    const now = new Date('2026-05-04T10:00:30.000Z').getTime();
    const deadline = new Date('2026-05-04T12:06:29.000Z').getTime();

    expect(formatPauseOpenMaxRemaining(deadline, now)).toBe('2h 5m');
  });

  it('formats sub-minute remaining time as seconds', () => {
    const now = new Date('2026-05-04T10:00:00.000Z').getTime();
    const deadline = now + 45_900;

    expect(formatPauseOpenMaxRemaining(deadline, now)).toBe('45s');
  });

  it('clamps elapsed deadlines to 0m', () => {
    const now = new Date('2026-05-04T10:00:00.000Z').getTime();

    expect(formatPauseOpenMaxRemaining(now - 1, now)).toBe('0m');
  });
});
