import { describe, it, expect } from 'vitest';
import { computeBriefPauseStatsPreview } from '@/lib/pause-brief-stats-preview';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';

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

const emptyPayload = { rows: [], stepEvents: [], companionEvents: [] };

describe('computeBriefPauseStatsPreview', () => {
  it('returns missing_instance_row when the instance is not among completed rows', () => {
    const row = makeRow({ id: 'a' });
    const out = computeBriefPauseStatsPreview({
      payload: { rows: [row], stepEvents: [], companionEvents: [] },
      holdGoal: null,
      completedInstanceId: 'ghost',
    });
    expect(out).toEqual({ status: 'missing_instance_row' });
  });

  it('returns missing_instance_row when only non-completed rows match id', () => {
    const row = makeRow({ id: 'a', state: 'active' });
    const out = computeBriefPauseStatsPreview({
      payload: { rows: [row], stepEvents: [], companionEvents: [] },
      holdGoal: null,
      completedInstanceId: 'a',
    });
    expect(out).toEqual({ status: 'missing_instance_row' });
  });

  it('returns first_pause when this is the only completed pause', () => {
    const row = makeRow({ id: 'only' });
    const out = computeBriefPauseStatsPreview({
      payload: { rows: [row], stepEvents: [], companionEvents: [] },
      holdGoal: null,
      completedInstanceId: 'only',
    });
    expect(out).toMatchObject({ status: 'first_pause' });
    if (out.status === 'first_pause') {
      expect(out.compositeScore).toBeGreaterThan(0);
      expect(out.sampleSize).toBe(1);
    }
  });

  it('returns delta when a second completed pause changes the rolling aggregate', () => {
    const older = makeRow({
      id: 'older',
      created_at: '2026-04-20T12:00:00.000Z',
      outcome: 'sold',
      shift_mood: 'anxious',
      initial_mood: 'fearful',
      has_breath_completed: false,
      counted_companion_count: 0,
    });
    const newer = makeRow({
      id: 'newer',
      created_at: '2026-04-23T20:00:00.000Z',
      outcome: 'held',
      shift_mood: 'calm',
      initial_mood: 'fearful',
      has_breath_completed: true,
      counted_companion_count: 2,
    });
    const out = computeBriefPauseStatsPreview({
      payload: { rows: [newer, older], stepEvents: [], companionEvents: [] },
      holdGoal: null,
      completedInstanceId: 'newer',
    });
    expect(out.status).toBe('delta');
    if (out.status === 'delta') {
      expect(out.sampleSize).toBe(2);
      const moved =
        out.compositeDelta !== 0 || out.skills.some((s) => s.delta !== 0);
      expect(moved).toBe(true);
    }
  });

  it('treats empty payload as missing row', () => {
    expect(
      computeBriefPauseStatsPreview({
        payload: emptyPayload,
        holdGoal: null,
        completedInstanceId: 'x',
      }),
    ).toEqual({ status: 'missing_instance_row' });
  });
});
