import { describe, expect, it } from 'vitest';
import {
  formatPauseOpenMaxRemaining,
  PAUSE_OPEN_MAX_AGE_MS,
  pauseOpenMaxDeadlineMs,
} from '@/lib/pause-open-max-countdown';

describe('pause-open-max-countdown', () => {
  it('sets the deadline exactly 12 hours after the engaged anchor', () => {
    const engagedAt = '2026-05-12T08:15:00.000Z';

    expect(pauseOpenMaxDeadlineMs(engagedAt)).toBe(
      Date.parse(engagedAt) + PAUSE_OPEN_MAX_AGE_MS,
    );
  });

  it('formats remaining time with hours and minutes for the engaged window', () => {
    const now = Date.parse('2026-05-12T08:15:00.000Z');
    const deadline = now + 3 * 60 * 60 * 1000 + 7 * 60 * 1000 + 59 * 1000;

    expect(formatPauseOpenMaxRemaining(deadline, now)).toBe('3h 7m');
  });

  it('uses minutes, seconds, then 0m at the boundary', () => {
    const now = Date.parse('2026-05-12T08:15:00.000Z');

    expect(formatPauseOpenMaxRemaining(now + 59 * 60 * 1000, now)).toBe('59m');
    expect(formatPauseOpenMaxRemaining(now + 59 * 1000, now)).toBe('59s');
    expect(formatPauseOpenMaxRemaining(now, now)).toBe('0m');
    expect(formatPauseOpenMaxRemaining(now - 1, now)).toBe('0m');
  });
});
