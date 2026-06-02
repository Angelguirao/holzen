import { describe, expect, it } from 'vitest';
import { EMPTY_PRACTICE_XP_BY_SIGNAL } from './practice-xp-by-signal';
import { mapPracticeSummaryRpc, practiceSummaryToHomeStats } from './practice-summary';

describe('mapPracticeSummaryRpc', () => {
  it('maps snake_case RPC fields', () => {
    expect(
      mapPracticeSummaryRpc({
        completed_pause_count: 12,
        presence_xp_total: 220,
        completed_brief_count: 5,
        completed_deep_count: 7,
        xp_by_signal: { base: 60, breath: 80, mood_regulation: 0, tools: 40, reflection: 30, brief_decision: 10, brief_entry_mood: 0 },
      }),
    ).toEqual({
      completedPauseCount: 12,
      presenceXpTotal: 220,
      completedBriefCount: 5,
      completedDeepCount: 7,
      xpBySignal: {
        base: 60,
        breath: 80,
        mood_regulation: 0,
        tools: 40,
        reflection: 30,
        brief_decision: 10,
        brief_entry_mood: 0,
      },
    });
  });

  it('returns zeros for invalid payload', () => {
    expect(mapPracticeSummaryRpc(null).completedPauseCount).toBe(0);
  });
});

describe('practiceSummaryToHomeStats', () => {
  it('aliases presence XP for Home tiles', () => {
    expect(
      practiceSummaryToHomeStats({
        completedPauseCount: 3,
        presenceXpTotal: 40,
        completedBriefCount: 1,
        completedDeepCount: 2,
        xpBySignal: EMPTY_PRACTICE_XP_BY_SIGNAL,
      }),
    ).toEqual({ completedPauseCount: 3, presenceXp: 40 });
  });
});
