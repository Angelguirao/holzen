import { describe, expect, it } from 'vitest';
import { mapPracticeSummaryRpc, practiceSummaryToHomeStats } from './practice-summary';

describe('mapPracticeSummaryRpc', () => {
  it('maps snake_case RPC fields', () => {
    expect(
      mapPracticeSummaryRpc({
        completed_pause_count: 12,
        presence_xp_total: 220,
        completed_brief_count: 5,
        completed_deep_count: 7,
      }),
    ).toEqual({
      completedPauseCount: 12,
      presenceXpTotal: 220,
      completedBriefCount: 5,
      completedDeepCount: 7,
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
      }),
    ).toEqual({ completedPauseCount: 3, presenceXp: 40 });
  });
});
