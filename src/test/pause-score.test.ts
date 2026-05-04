import { describe, it, expect } from 'vitest';
import { computePauseScore } from '@/lib/stats/pause-score';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';

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
    has_outcome_logged: true,
    initial_mood: 'fearful',
    is_brief_ritual: false,
    initial_emotion_intensity: null,
    shift_mood: 'calm',
    shift_emotion_intensity: null,
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
});
