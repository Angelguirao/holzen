import { describe, it, expect } from 'vitest';
import {
  computePauseState,
  shouldCountCompanion,
  decideCronFire,
  collectStepTypes,
  countedCompanionCount,
  pauseWindowShowsClockCountdown,
  type PauseInstanceRow,
  type PauseTemplateRow,
  type PauseStepEventRow,
  type PauseCompanionEventRow,
} from '@/lib/pause-state';

const NOW = new Date('2026-04-23T20:00:00.000Z');

/** Mirrors production volatility_v1 after optional action window: no clock-only expiry. */
const volatilityTemplate: PauseTemplateRow = {
  slug: 'volatility_v1',
  window_ms: 6 * 60 * 60 * 1000,
  action_window_ms: null,
  dismissal_suppression_ms: 6 * 60 * 60 * 1000,
  required_for_engaged: ['breath_completed', 'initial_emotion_logged'],
  required_for_completed: [
    'breath_completed',
    'initial_emotion_logged',
    'shift_emotion_logged',
    'outcome_logged',
  ],
  allowed_companion_types: ['signal', 'ground_nudge', 'historical_insight', 'zoom_out', 'haiku'],
  required_companion_count: 1,
};

const clockBoundedVolatility: PauseTemplateRow = {
  ...volatilityTemplate,
  action_window_ms: 6 * 60 * 60 * 1000,
};

function makeInstance(overrides: Partial<PauseInstanceRow> = {}): PauseInstanceRow {
  return {
    id: 'p1',
    user_id: 'u1',
    state: 'active',
    window_starts_at: '2026-04-23T18:00:00.000Z',
    window_ends_at: '2026-04-24T00:00:00.000Z',
    context_fingerprint: 'fp-regime-A',
    created_at: '2026-04-23T18:00:00.000Z',
    engaged_at: null,
    completed_at: null,
    terminal_at: null,
    expired_reason: null,
    ...overrides,
  };
}

function makeStep(
  overrides: Partial<PauseStepEventRow> = {},
): PauseStepEventRow {
  return {
    pause_instance_id: 'p1',
    step_type: 'breath_completed',
    created_at: '2026-04-23T18:10:00.000Z',
    ...overrides,
  };
}

function makeCompanion(
  overrides: Partial<PauseCompanionEventRow> = {},
): PauseCompanionEventRow {
  return {
    pause_instance_id: 'p1',
    companion_type: 'signal',
    action: 'complete',
    counts_for_pause: true,
    non_counting_reason: null,
    created_at: '2026-04-23T18:20:00.000Z',
    ...overrides,
  };
}

describe('pauseWindowShowsClockCountdown', () => {
  it('is false for far-future window ends', () => {
    expect(pauseWindowShowsClockCountdown('2126-01-01T00:00:00.000Z', NOW)).toBe(false);
  });
  it('is true for windows within a few years', () => {
    expect(pauseWindowShowsClockCountdown('2026-04-24T00:00:00.000Z', NOW)).toBe(true);
  });
});

describe('collectStepTypes', () => {
  it('returns only distinct step types for the matching instance', () => {
    const out = collectStepTypes(
      [
        makeStep({ step_type: 'breath_completed' }),
        makeStep({ step_type: 'initial_emotion_logged' }),
        makeStep({ step_type: 'initial_emotion_logged' }),
        makeStep({ pause_instance_id: 'other', step_type: 'outcome_logged' }),
      ],
      'p1',
    );
    expect(out.size).toBe(2);
    expect(out.has('breath_completed')).toBe(true);
    expect(out.has('initial_emotion_logged')).toBe(true);
    expect(out.has('outcome_logged')).toBe(false);
  });
});

describe('countedCompanionCount', () => {
  it('ignores open actions, non-counting completes, and duplicates of same type', () => {
    const out = countedCompanionCount(
      [
        makeCompanion({ companion_type: 'signal' }),
        makeCompanion({ companion_type: 'signal' }), // duplicate type
        makeCompanion({ companion_type: 'ground_nudge' }),
        makeCompanion({ action: 'open', companion_type: 'haiku' }),
        makeCompanion({ counts_for_pause: false, companion_type: 'zoom_out', non_counting_reason: 'outside_window' }),
        makeCompanion({ pause_instance_id: 'other', companion_type: 'haiku' }),
      ],
      'p1',
    );
    expect(out).toBe(2);
  });
});

describe('computePauseState', () => {
  it('keeps terminal states', () => {
    for (const s of ['completed', 'dismissed', 'expired'] as const) {
      expect(
        computePauseState({
          instance: makeInstance({ state: s }),
          template: volatilityTemplate,
          stepEvents: [],
          companionEvents: [],
          now: NOW,
        }),
      ).toBe(s);
    }
  });

  it('expires when window elapsed only if template has a clock-bound action_window_ms', () => {
    expect(
      computePauseState({
        instance: makeInstance({ window_ends_at: '2026-04-23T19:00:00.000Z' }),
        template: clockBoundedVolatility,
        stepEvents: [],
        companionEvents: [],
        now: NOW,
      }),
    ).toBe('expired');
  });

  it('does not clock-expire when action_window_ms is null even if window_ends_at is in the past', () => {
    expect(
      computePauseState({
        instance: makeInstance({ window_ends_at: '2026-04-23T19:00:00.000Z' }),
        template: volatilityTemplate,
        stepEvents: [],
        companionEvents: [],
        now: NOW,
      }),
    ).toBe('active');
  });

  it('stays active while gates unmet', () => {
    expect(
      computePauseState({
        instance: makeInstance(),
        template: volatilityTemplate,
        stepEvents: [makeStep({ step_type: 'breath_completed' })],
        companionEvents: [],
        now: NOW,
      }),
    ).toBe('active');
  });

  it('engages when breath + initial emotion are present', () => {
    expect(
      computePauseState({
        instance: makeInstance(),
        template: volatilityTemplate,
        stepEvents: [
          makeStep({ step_type: 'breath_completed' }),
          makeStep({ step_type: 'initial_emotion_logged' }),
        ],
        companionEvents: [],
        now: NOW,
      }),
    ).toBe('engaged');
  });

  it('does not complete without a counted companion, even with all step gates met', () => {
    expect(
      computePauseState({
        instance: makeInstance({ state: 'engaged' }),
        template: volatilityTemplate,
        stepEvents: [
          makeStep({ step_type: 'breath_completed' }),
          makeStep({ step_type: 'initial_emotion_logged' }),
          makeStep({ step_type: 'shift_emotion_logged' }),
          makeStep({ step_type: 'outcome_logged' }),
        ],
        companionEvents: [],
        now: NOW,
      }),
    ).toBe('engaged');
  });

  it('does not complete with step gates met + non-counting companion complete', () => {
    expect(
      computePauseState({
        instance: makeInstance({ state: 'engaged' }),
        template: volatilityTemplate,
        stepEvents: [
          makeStep({ step_type: 'breath_completed' }),
          makeStep({ step_type: 'initial_emotion_logged' }),
          makeStep({ step_type: 'shift_emotion_logged' }),
          makeStep({ step_type: 'outcome_logged' }),
        ],
        companionEvents: [
          makeCompanion({ counts_for_pause: false, non_counting_reason: 'outside_window' }),
        ],
        now: NOW,
      }),
    ).toBe('engaged');
  });

  it('completes when all step gates met AND >= 1 counted companion', () => {
    expect(
      computePauseState({
        instance: makeInstance({ state: 'engaged' }),
        template: volatilityTemplate,
        stepEvents: [
          makeStep({ step_type: 'breath_completed' }),
          makeStep({ step_type: 'initial_emotion_logged' }),
          makeStep({ step_type: 'shift_emotion_logged' }),
          makeStep({ step_type: 'outcome_logged' }),
        ],
        companionEvents: [makeCompanion({})],
        now: NOW,
      }),
    ).toBe('completed');
  });

  it('treats required_companion_count > 1 strictly', () => {
    const tpl: PauseTemplateRow = { ...volatilityTemplate, required_companion_count: 2 };
    expect(
      computePauseState({
        instance: makeInstance({ state: 'engaged' }),
        template: tpl,
        stepEvents: [
          makeStep({ step_type: 'breath_completed' }),
          makeStep({ step_type: 'initial_emotion_logged' }),
          makeStep({ step_type: 'shift_emotion_logged' }),
          makeStep({ step_type: 'outcome_logged' }),
        ],
        companionEvents: [makeCompanion({ companion_type: 'signal' })],
        now: NOW,
      }),
    ).toBe('engaged');
    expect(
      computePauseState({
        instance: makeInstance({ state: 'engaged' }),
        template: tpl,
        stepEvents: [
          makeStep({ step_type: 'breath_completed' }),
          makeStep({ step_type: 'initial_emotion_logged' }),
          makeStep({ step_type: 'shift_emotion_logged' }),
          makeStep({ step_type: 'outcome_logged' }),
        ],
        companionEvents: [
          makeCompanion({ companion_type: 'signal' }),
          makeCompanion({ companion_type: 'ground_nudge' }),
        ],
        now: NOW,
      }),
    ).toBe('completed');
  });
});

describe('shouldCountCompanion', () => {
  it('rejects with no_active_pause when no instance is open', () => {
    expect(
      shouldCountCompanion({
        openInstance: null,
        template: volatilityTemplate,
        companionEvents: [],
        companionType: 'signal',
        now: NOW,
      }),
    ).toEqual({ counts: false, reason: 'no_active_pause' });
  });

  it('rejects with outside_window when window has elapsed and template is clock-bound', () => {
    expect(
      shouldCountCompanion({
        openInstance: makeInstance({ window_ends_at: '2026-04-23T19:00:00.000Z' }),
        template: clockBoundedVolatility,
        companionEvents: [],
        companionType: 'signal',
        now: NOW,
      }),
    ).toEqual({ counts: false, reason: 'outside_window' });
  });

  it('does not reject for elapsed window when action_window_ms is null', () => {
    expect(
      shouldCountCompanion({
        openInstance: makeInstance({ window_ends_at: '2026-04-23T19:00:00.000Z' }),
        template: volatilityTemplate,
        companionEvents: [],
        companionType: 'signal',
        now: NOW,
      }),
    ).toEqual({ counts: true });
  });

  it('rejects with context_lost when instance is expired for context_lost', () => {
    expect(
      shouldCountCompanion({
        openInstance: makeInstance({ state: 'expired', expired_reason: 'context_lost' }),
        template: volatilityTemplate,
        companionEvents: [],
        companionType: 'signal',
        now: NOW,
      }),
    ).toEqual({ counts: false, reason: 'context_lost' });
  });

  it('rejects with not_allowed_for_template when companion not in the allowed set', () => {
    expect(
      shouldCountCompanion({
        openInstance: makeInstance({ state: 'active' }),
        template: volatilityTemplate,
        companionEvents: [],
        companionType: 'mystery_type',
        now: NOW,
      }),
    ).toEqual({ counts: false, reason: 'not_allowed_for_template' });
  });

  it('rejects with already_counted when a counted completion exists for same type', () => {
    expect(
      shouldCountCompanion({
        openInstance: makeInstance({ state: 'active' }),
        template: volatilityTemplate,
        companionEvents: [makeCompanion({ companion_type: 'signal' })],
        companionType: 'signal',
        now: NOW,
      }),
    ).toEqual({ counts: false, reason: 'already_counted' });
  });

  it('counts when all conditions pass', () => {
    expect(
      shouldCountCompanion({
        openInstance: makeInstance({ state: 'engaged' }),
        template: volatilityTemplate,
        companionEvents: [],
        companionType: 'ground_nudge',
        now: NOW,
      }),
    ).toEqual({ counts: true });
  });
});

describe('decideCronFire', () => {
  it('creates when no open pause and no matching terminal', () => {
    expect(
      decideCronFire({
        openInstance: null,
        recentTerminalMatch: null,
        newFingerprint: 'fp-A',
      }),
    ).toEqual({ action: 'create' });
  });

  it('rejects with fingerprint_match when open pause has same fingerprint', () => {
    expect(
      decideCronFire({
        openInstance: makeInstance({ context_fingerprint: 'fp-A' }),
        recentTerminalMatch: null,
        newFingerprint: 'fp-A',
      }),
    ).toEqual({ action: 'reject', reason: 'fingerprint_match' });
  });

  it('supersedes when open pause has different fingerprint', () => {
    expect(
      decideCronFire({
        openInstance: makeInstance({ context_fingerprint: 'fp-A' }),
        recentTerminalMatch: null,
        newFingerprint: 'fp-B',
      }),
    ).toEqual({ action: 'supersede', oldInstanceId: 'p1' });
  });

  it('rejects with recent_dismissal when no open pause but recent terminal fingerprint matches', () => {
    expect(
      decideCronFire({
        openInstance: null,
        recentTerminalMatch: makeInstance({ state: 'dismissed', context_fingerprint: 'fp-A' }),
        newFingerprint: 'fp-A',
      }),
    ).toEqual({ action: 'reject', reason: 'recent_dismissal' });
  });

  it('creates when recent terminal fingerprint does not match the new one', () => {
    expect(
      decideCronFire({
        openInstance: null,
        recentTerminalMatch: makeInstance({ state: 'dismissed', context_fingerprint: 'fp-OLD' }),
        newFingerprint: 'fp-NEW',
      }),
    ).toEqual({ action: 'create' });
  });
});
