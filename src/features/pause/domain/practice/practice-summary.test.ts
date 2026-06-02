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
        xp_by_signal: {
          base_brief: 30,
          base_deep: 90,
          favorite: 10,
          note: 9,
          companions: 40,
          companion_favorites: 4,
          breath_second: 20,
          shift_mood: 6,
        },
      }),
    ).toEqual({
      completedPauseCount: 12,
      presenceXpTotal: 220,
      completedBriefCount: 5,
      completedDeepCount: 7,
      xpBySignal: {
        base_brief: 30,
        base_deep: 90,
        favorite: 10,
        note: 9,
        companions: 40,
        companion_favorites: 4,
        breath_second: 20,
        shift_mood: 6,
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
