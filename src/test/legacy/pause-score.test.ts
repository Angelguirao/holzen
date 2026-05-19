import { describe, it, expect } from 'vitest';
import { computePauseScore } from '@/legacy/full-shell/src/lib/stats/pause-score';
import type { PauseFullRow } from '@/legacy/full-shell/src/lib/pause-stats-data-query';

function makeRow(overrides: Partial<PauseFullRow>): PauseFullRow {
  return {
    id: 'p1',
    user_id: 'u1',
    state: 'completed',
    source: 'manual',
    context_snapshot: { change_24h_pct: -3 },
    context_fingerprint: 'fp',
    window_starts_at: '2026-04-23T18:00:00.000Z',
    window_ends_at: '2026-04-24T00:00:00.000Z',
    created_at: '2026-04-23T18:00:00.000Z',
    engaged_at: '2026-04-23T18:05:00.000Z',
    completed_at: '2026-04-23T18:20:00.000Z',
    terminal_at: '2026-04-23T18:20:00.000Z',
    expired_reason: null,
    has_breath_completed: true,
    has_initial_emotion_logged: true,
    has_shift_emotion_logged: true,
    has_post_pause_emotion_logged: false,
    has_outcome_logged: true,
    initial_mood: 'fearful',
    is_brief_ritual: false,
    initial_emotion_intensity: null,
    shift_mood: 'calm',
    shift_emotion_intensity: null,
    post_pause_mood: null,
    post_pause_emotion_intensity: null,
    outcome: 'held',
    note_text: null,
    tags: null,
    is_favorite: false,
    counted_companion_count: 1,
    counted_companion_types: ['signal'],
    reflection_text: null,
    haiku_text: null,
    ...overrides,
  };
}

describe('computePauseScore', () => {
  it('returns null for empty input', () => {
    expect(
      computePauseScore({ completedRows: [], stepEvents: [], companionEvents: [] }),
    ).toBeNull();
  });

  it('produces a composite score and all five skill values for a full-ritual row', () => {
    const row = makeRow({});
    const out = computePauseScore({
      completedRows: [row],
      stepEvents: [],
      companionEvents: [],
    });
    expect(out).not.toBeNull();
    expect(out!.score).toBeGreaterThan(0);
    expect(out!.score).toBeLessThanOrEqual(100);
    expect(out!.emotionalRegulation).toBeGreaterThan(50); // fearful -> calm is a positive shift
    expect(out!.distressTolerance).toBeGreaterThan(50); // 'held' under moderate volatility
    expect(out!.decisionAlignment).toBe(50); // no hold goal
    expect(out!.cognitiveReappraisal).toBeGreaterThan(0); // 1 counted companion
    expect(out!.selfAwareness).toBeGreaterThan(0); // shift_emotion_logged
  });

  it('redistributes decision weight when no hold goal is provided', () => {
    const row = makeRow({});
    const withoutGoal = computePauseScore({
      completedRows: [row],
      stepEvents: [],
      companionEvents: [],
    })!;
    const withGoal = computePauseScore({
      completedRows: [row],
      stepEvents: [],
      companionEvents: [],
      holdGoal: {
        type: 'forever',
        targetMonths: null,
        targetPrice: null,
        start: '2026-01-01',
      },
    })!;
    expect(withoutGoal.decisionAlignment).toBe(50);
    expect(withGoal.decisionAlignment).toBe(100); // held aligns with forever
  });

  it('sampleSize reports the trimmed recent window (<=30)', () => {
    const rows = Array.from({ length: 40 }, (_, i) =>
      makeRow({ id: `p${i}`, created_at: `2026-04-${(i % 28) + 1}T12:00:00.000Z` }),
    );
    const out = computePauseScore({
      completedRows: rows,
      stepEvents: [],
      companionEvents: [],
    })!;
    expect(out.sampleSize).toBe(30);
  });

  describe('distress tolerance: context-aware bought scoring', () => {
    it('held score stays at 60 + tier*20 across volatility tiers', () => {
      const mild = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'held', context_snapshot: { change_24h_pct: -1 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      const moderate = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'held', context_snapshot: { change_24h_pct: -5 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      const severe = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'held', context_snapshot: { change_24h_pct: -10 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(mild.distressTolerance).toBe(80); // 60 + 1.0 * 20
      expect(moderate.distressTolerance).toBe(90); // 60 + 1.5 * 20
      expect(severe.distressTolerance).toBe(100); // 60 + 2.0 * 20 capped
    });

    it('bought during a dip (down) scores higher with tier (50 + tier*10)', () => {
      const mildDip = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: -1 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      const moderateDip = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: -5 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      const severeDip = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: -10 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(mildDip.distressTolerance).toBe(60); // 50 + 1.0 * 10
      expect(moderateDip.distressTolerance).toBe(65); // 50 + 1.5 * 10
      expect(severeDip.distressTolerance).toBe(70); // 50 + 2.0 * 10
    });

    it('bought during a spike (up) scores lower with tier (50 - tier*10)', () => {
      const mildSpike = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: 1 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      const moderateSpike = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: 5 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      const severeSpike = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: 10 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(mildSpike.distressTolerance).toBe(40); // 50 - 1.0 * 10
      expect(moderateSpike.distressTolerance).toBe(35); // 50 - 1.5 * 10
      expect(severeSpike.distressTolerance).toBe(30); // 50 - 2.0 * 10
    });

    it('bought with flat market (0%) falls back to neutral 45', () => {
      const flat = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'bought', context_snapshot: { change_24h_pct: 0 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(flat.distressTolerance).toBe(45);
    });

    it('legacy `nothing` outcome rows score as the catch-all neutral 50', () => {
      const nothing = computePauseScore({
        completedRows: [
          makeRow({ outcome: 'nothing', context_snapshot: { change_24h_pct: -10 } }),
        ],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(nothing.distressTolerance).toBe(50);
    });
  });

  describe('decision alignment: legacy nothing no longer hold-aligned', () => {
    it('legacy `nothing` row scores 50 (neutral) under a forever hold goal', () => {
      const out = computePauseScore({
        completedRows: [makeRow({ outcome: 'nothing' })],
        stepEvents: [],
        companionEvents: [],
        holdGoal: {
          type: 'forever',
          targetMonths: null,
          targetPrice: null,
          start: '2026-01-01',
        },
      })!;
      expect(out.decisionAlignment).toBe(50);
    });

    it('held + bought + sold scoring under forever hold goal is unchanged (100 / 60 / 15)', () => {
      const heldOut = computePauseScore({
        completedRows: [makeRow({ outcome: 'held' })],
        stepEvents: [],
        companionEvents: [],
        holdGoal: { type: 'forever', targetMonths: null, targetPrice: null, start: null },
      })!;
      const boughtOut = computePauseScore({
        completedRows: [makeRow({ outcome: 'bought' })],
        stepEvents: [],
        companionEvents: [],
        holdGoal: { type: 'forever', targetMonths: null, targetPrice: null, start: null },
      })!;
      const soldOut = computePauseScore({
        completedRows: [makeRow({ outcome: 'sold' })],
        stepEvents: [],
        companionEvents: [],
        holdGoal: { type: 'forever', targetMonths: null, targetPrice: null, start: null },
      })!;
      expect(heldOut.decisionAlignment).toBe(100);
      expect(boughtOut.decisionAlignment).toBe(60);
      expect(soldOut.decisionAlignment).toBe(15);
    });
  });

  describe('post_pause_emotion_logged', () => {
    it('prefers post_pause_mood over shift_mood for emotional regulation', () => {
      const stuck = makeRow({
        initial_mood: 'anxious',
        shift_mood: 'anxious',
        post_pause_mood: 'calm',
        has_post_pause_emotion_logged: true,
      });
      const out = computePauseScore({
        completedRows: [stuck],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(out.emotionalRegulation).toBeGreaterThan(50);
    });

    it('counts post_pause toward self-awareness depth bonus like shift', () => {
      const withPostOnly = makeRow({
        has_shift_emotion_logged: false,
        shift_mood: null,
        has_post_pause_emotion_logged: true,
        post_pause_mood: 'calm',
        post_pause_emotion_intensity: 3,
      });
      const out = computePauseScore({
        completedRows: [withPostOnly],
        stepEvents: [],
        companionEvents: [],
      })!;
      expect(out.selfAwareness).toBe(15);
    });
  });
});
