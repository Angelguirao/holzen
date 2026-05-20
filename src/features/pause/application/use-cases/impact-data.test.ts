import { describe, expect, it } from 'vitest';
import { buildPauseImpactDataOnComplete } from './impact-data';

const base = () => ({
  decision: 'hold',
  context: 'c',
  selectedMood: 'calm' as const,
  selectedMoodAfter: 'fomo' as const,
  feelIntensity: 3,
  shiftIntensity: 4,
  reinforcementQuote: '"Hi" — Author',
  reflectionMessage: 'Reflection body',
  haiku: 'one\ntwo\nthree' as string | null,
});

describe('buildPauseImpactDataOnComplete', () => {
  it('brief: breathingCompleted follows first segment only', () => {
    const d = buildPauseImpactDataOnComplete({
      ...base(),
      ritualEntry: 'brief',
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });
    expect(d.breathingCompleted).toBe(true);
  });

  it('deep: requires both breath segments when second exists in ritual', () => {
    expect(
      buildPauseImpactDataOnComplete({
        ...base(),
        ritualEntry: 'deep',
        breathingFirstCompleted: true,
        breathingSecondCompleted: false,
      }).breathingCompleted,
    ).toBe(false);
    expect(
      buildPauseImpactDataOnComplete({
        ...base(),
        ritualEntry: 'deep',
        breathingFirstCompleted: true,
        breathingSecondCompleted: true,
      }).breathingCompleted,
    ).toBe(true);
  });

  it('picker uses deep breath rule', () => {
    expect(
      buildPauseImpactDataOnComplete({
        ...base(),
        ritualEntry: 'picker',
        breathingFirstCompleted: true,
        breathingSecondCompleted: false,
      }).breathingCompleted,
    ).toBe(false);
  });

  it('passes through static done fields and quote', () => {
    const d = buildPauseImpactDataOnComplete({
      ...base(),
      ritualEntry: 'brief',
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });
    expect(d.decision).toBe('hold');
    expect(d.context).toBe('c');
    expect(d.engagedTools).toBe(0);
    expect(d.wroteNote).toBe(false);
    expect(d.usedTags).toBe(false);
    expect(d.reinforcementQuote).toBe('"Hi" — Author');
    expect(d.reflectionMessage).toBe('Reflection body');
    expect(d.haiku).toBe('one\ntwo\nthree');
  });
});
