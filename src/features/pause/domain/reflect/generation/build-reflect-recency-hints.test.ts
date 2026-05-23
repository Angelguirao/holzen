import { describe, expect, it } from 'vitest';
import { buildReflectRecencyHintsFromRows } from './build-reflect-recency-hints';

describe('buildReflectRecencyHintsFromRows', () => {
  it('builds mood history from initial_emotion_logged + outcome_logged per instance', () => {
    const hints = buildReflectRecencyHintsFromRows(
      [
        {
          pause_instance_id: 'a',
          step_type: 'initial_emotion_logged',
          payload: { mood: 'calm' },
          created_at: '2026-05-20T10:00:00Z',
        },
        {
          pause_instance_id: 'a',
          step_type: 'outcome_logged',
          payload: { outcome: 'held' },
          created_at: '2026-05-20T11:00:00Z',
        },
      ],
      [],
    );
    expect(hints.moodHistory).toEqual([
      { mood: 'calm', outcome: 'held', created_at: '2026-05-20T10:00:00Z' },
    ]);
  });

  it('collects recent reflection messages and haikus (max 5 each)', () => {
    const hints = buildReflectRecencyHintsFromRows(
      [],
      [
        { kind: 'reflection_text', content: { message: 'one' } },
        { kind: 'reflection_text', content: { message: 'two' } },
        { kind: 'haiku', content: { haiku: 'line' } },
      ],
    );
    expect(hints.recentMessages).toEqual(['one', 'two']);
    expect(hints.recentHaikus).toEqual(['line']);
  });

  it('returns empty object when no rows', () => {
    expect(buildReflectRecencyHintsFromRows([], [])).toEqual({});
  });
});
