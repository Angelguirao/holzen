import { describe, it, expect } from 'vitest';
import { computeBadges } from '@/lib/badges/compute';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';
import type { PauseCompanionEventRow } from '@/lib/pause-state';

function makeRow(overrides: Partial<PauseFullRow>): PauseFullRow {
  return {
    id: 'p1',
    user_id: 'u1',
    state: 'completed',
    source: 'manual',
    context_snapshot: { change_24h_pct: -3, severity: 'moderate' },
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

function makeCompanion(
  overrides: Partial<PauseCompanionEventRow>,
): PauseCompanionEventRow {
  return {
    pause_instance_id: 'p1',
    companion_type: 'signal',
    action: 'complete',
    counts_for_pause: true,
    non_counting_reason: null,
    created_at: '2026-04-23T18:15:00.000Z',
    ...overrides,
  };
}

function getBadge(snapshots: ReturnType<typeof computeBadges>, id: string) {
  const b = snapshots.find((s) => s.id === id);
  if (!b) throw new Error(`badge ${id} not in snapshot`);
  return b;
}

describe('computeBadges: Foundation', () => {
  it('first-pause earns at 1 completed pause', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({})],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps, 'first-pause').earned).toBe(true);
  });

  it('first-week needs 3 distinct days within a rolling 7-day window', () => {
    const rows = [
      makeRow({ id: 'a', completed_at: '2026-04-10T10:00:00.000Z' }),
      makeRow({ id: 'b', completed_at: '2026-04-12T10:00:00.000Z' }),
      makeRow({ id: 'c', completed_at: '2026-04-15T10:00:00.000Z' }),
    ];
    const snaps = computeBadges({ completedRows: rows, stepEvents: [], companionEvents: [] });
    expect(getBadge(snaps, 'first-week').earned).toBe(true);
  });

  it('first-ritual requires a counted companion event', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({ counted_companion_count: 0 })],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps, 'first-ritual').earned).toBe(false);
    const snaps2 = computeBadges({
      completedRows: [makeRow({ counted_companion_count: 1 })],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps2, 'first-ritual').earned).toBe(true);
  });
});

describe('computeBadges: Core skills', () => {
  it('regulation counts reactive -> composed transitions', () => {
    const rows = [
      makeRow({ id: 'a', initial_mood: 'fearful', shift_mood: 'calm' }),
      makeRow({ id: 'b', initial_mood: 'calm', shift_mood: 'calm' }), // not reactive -> skipped
      makeRow({ id: 'c', initial_mood: 'fomo', shift_mood: 'detached' }),
      makeRow({ id: 'd', initial_mood: 'fearful', shift_mood: 'fearful' }), // not composed -> skipped
    ];
    const snaps = computeBadges({ completedRows: rows, stepEvents: [], companionEvents: [] });
    expect(getBadge(snaps, 'regulation-10').current).toBe(2);
  });

  it('tolerance requires held outcome AND severity >= moderate (legacy nothing rows do not count)', () => {
    const rows = [
      makeRow({ id: 'a', outcome: 'held', context_snapshot: { severity: 'moderate' } }),
      makeRow({ id: 'b', outcome: 'held', context_snapshot: { severity: 'mild' } }), // sev too low
      makeRow({ id: 'c', outcome: 'sold', context_snapshot: { severity: 'high' } }), // not hold
      makeRow({ id: 'd', outcome: 'nothing', context_snapshot: { severity: 'high' } }), // legacy alias, no longer counted
    ];
    const snaps = computeBadges({ completedRows: rows, stepEvents: [], companionEvents: [] });
    expect(getBadge(snaps, 'tolerance-5').current).toBe(1);
  });

  it('alignment with forever hold goal counts only `held` (legacy nothing rows do not count)', () => {
    const rows = [
      makeRow({ id: 'a', outcome: 'held' }),
      makeRow({ id: 'b', outcome: 'bought' }),
      makeRow({ id: 'c', outcome: 'nothing' }), // legacy alias, no longer counted
    ];
    const snaps = computeBadges({
      completedRows: rows,
      stepEvents: [],
      companionEvents: [],
      holdGoal: { type: 'forever' },
    });
    expect(getBadge(snaps, 'alignment-5').current).toBe(1);
  });

  it('alignment is zero when no hold goal is set', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({ outcome: 'held' })],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps, 'alignment-5').current).toBe(0);
  });

  it('reappraisal counts only counted companion completions for completed pauses', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({ id: 'p1' })],
      stepEvents: [],
      companionEvents: [
        makeCompanion({ pause_instance_id: 'p1', companion_type: 'signal' }),
        makeCompanion({ pause_instance_id: 'p1', companion_type: 'haiku' }),
        makeCompanion({
          pause_instance_id: 'p1',
          companion_type: 'ground_nudge',
          counts_for_pause: false,
          non_counting_reason: 'outside_window',
        }),
        makeCompanion({ pause_instance_id: 'p2', companion_type: 'signal' }), // not in completed set
      ],
    });
    expect(getBadge(snaps, 'reappraisal-10').current).toBe(2);
  });

  it('awareness counts depth signals (note, tags, favorite)', () => {
    const rows = [
      makeRow({ id: 'a', note_text: 'x'.repeat(50) }),
      makeRow({ id: 'b', tags: ['btc'] }),
      makeRow({ id: 'c', is_favorite: true }),
      makeRow({ id: 'd' }), // nothing -> skipped
    ];
    const snaps = computeBadges({ completedRows: rows, stepEvents: [], companionEvents: [] });
    expect(getBadge(snaps, 'awareness-10').current).toBe(3);
  });
});

describe('computeBadges: Mastery', () => {
  it('iron-hands requires >= 20 moderate+ pauses AND >= 80% hold rate', () => {
    const holdRows = Array.from({ length: 18 }, (_, i) =>
      makeRow({ id: `h${i}`, outcome: 'held' }),
    );
    const soldRows = Array.from({ length: 2 }, (_, i) =>
      makeRow({ id: `s${i}`, outcome: 'sold' }),
    );
    const snaps = computeBadges({
      completedRows: [...holdRows, ...soldRows],
      stepEvents: [],
      companionEvents: [],
    });
    const ih = getBadge(snaps, 'iron-hands');
    expect(ih.current).toBe(90); // 18/20 = 90%
    expect(ih.earned).toBe(true);
  });

  it('iron-hands is zero below the 20-sample minimum', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      makeRow({ id: `h${i}`, outcome: 'held' }),
    );
    const snaps = computeBadges({ completedRows: rows, stepEvents: [], companionEvents: [] });
    expect(getBadge(snaps, 'iron-hands').current).toBe(0);
  });
});

describe('computeBadges: Legacy', () => {
  it('btc-genesis fires for Jan 3 completion', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({ completed_at: '2026-01-03T12:00:00.000Z' })],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps, 'btc-genesis').earned).toBe(true);
  });

  it('btc-pizza fires for May 22 completion', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({ completed_at: '2026-05-22T12:00:00.000Z' })],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps, 'btc-pizza').earned).toBe(true);
  });

  it('btc-halving fires within 3 days of a halving', () => {
    const snaps = computeBadges({
      completedRows: [makeRow({ completed_at: '2024-04-22T12:00:00.000Z' })],
      stepEvents: [],
      companionEvents: [],
    });
    expect(getBadge(snaps, 'btc-halving').earned).toBe(true);
  });
});
