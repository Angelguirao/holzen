import { describe, expect, it } from 'vitest';
import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import { DEFAULT_PREFS } from '@/features/pause/domain/session-model';
import { estimatePresenceXpFromImpact } from './estimate-presence-xp-from-impact';
import { formatPauseRitualDurationMs } from './format-pause-ritual-duration';
import {
  formatPauseDoneDecisionLabel,
  formatPauseDoneMoodIntensityLine,
} from './format-pause-done-summary-labels';

describe('formatPauseRitualDurationMs', () => {
  it('formats minutes and seconds', () => {
    expect(formatPauseRitualDurationMs(623_000)).toBe('10 min 23 sec');
    expect(formatPauseRitualDurationMs(45_000)).toBe('45 sec');
    expect(formatPauseRitualDurationMs(120_000)).toBe('2 min');
  });
});

describe('formatPauseDoneSummaryLabels', () => {
  const t = ((key: string, opts?: { defaultValue?: string }) => {
    if (key === 'moodCheck.moods.fearful') return 'Fearful';
    if (key === 'pause.feelStep.intensity.strong') return 'Strong';
    if (key === 'pause.decide.hold') return 'Hold';
    return opts?.defaultValue ?? key;
  }) as import('i18next').TFunction;

  it('joins mood and intensity', () => {
    expect(formatPauseDoneMoodIntensityLine('fearful', 4, t)).toBe('Fearful · Strong');
    expect(formatPauseDoneDecisionLabel('hold', t)).toBe('Hold');
  });
});

describe('estimatePresenceXpFromImpact', () => {
  it('returns brief base only', () => {
    const data: PauseImpactData = {
      mood: 'calm',
      moodAfter: null,
      breathingCompleted: true,
      decision: 'hold',
      context: null,
      engagedTools: 0,
      wroteNote: false,
      usedTags: false,
      ritualDepth: 'brief',
    };
    expect(estimatePresenceXpFromImpact(data)).toBe(10);
  });

  it('stacks deep bonuses from snapshot fields', () => {
    const data: PauseImpactData = {
      mood: 'calm',
      moodAfter: 'calm',
      breathingCompleted: true,
      breathingSecondCompleted: true,
      decision: 'hold',
      context: null,
      engagedTools: 2,
      wroteNote: true,
      usedTags: false,
      shiftIntensity: 3,
      ritualDepth: 'deep',
      isFavorite: true,
      companionPrefs: DEFAULT_PREFS,
    };
    expect(estimatePresenceXpFromImpact(data)).toBe(18 + 2 + 3 + 4 + 4 + 3);
  });
});
