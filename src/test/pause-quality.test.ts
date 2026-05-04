import { describe, it, expect } from 'vitest';
import {
  computePauseQualityScore,
  PAUSE_QUALITY_WEIGHTS,
} from '@/lib/pause-quality';
import type {
  PauseInstanceRow,
  PauseTemplateRow,
  PauseStepEventRow,
  PauseCompanionEventRow,
} from '@/lib/pause-state';

const tpl: PauseTemplateRow = {
  slug: 'volatility_v1',
  window_ms: 21600000,
  action_window_ms: null,
  dismissal_suppression_ms: 21600000,
  required_for_engaged: ['initial_emotion_logged', 'breath_completed'],
  required_for_completed: ['outcome_logged'],
  allowed_companion_types: ['signal', 'ground_nudge', 'historical_insight', 'zoom_out', 'haiku'],
  required_companion_count: 0,
};

const inst: PauseInstanceRow = {
  id: 'p1',
  user_id: 'u1',
  state: 'completed',
  window_starts_at: '2026-04-23T18:00:00.000Z',
  window_ends_at: '2026-04-24T00:00:00.000Z',
  context_fingerprint: 'fp-A',
  created_at: '2026-04-23T18:00:00.000Z',
  engaged_at: '2026-04-23T18:05:00.000Z',
  completed_at: '2026-04-23T18:20:00.000Z',
  terminal_at: '2026-04-23T18:20:00.000Z',
  expired_reason: null,
};

function step(step_type: PauseStepEventRow['step_type'], payload: Record<string, unknown> = {}): PauseStepEventRow {
  return { pause_instance_id: 'p1', step_type, created_at: '2026-04-23T18:10:00.000Z', payload };
}

function companion(counts = true): PauseCompanionEventRow {
  return {
    pause_instance_id: 'p1',
    companion_type: 'signal',
    action: 'complete',
    counts_for_pause: counts,
    non_counting_reason: counts ? null : 'outside_window',
    created_at: '2026-04-23T18:15:00.000Z',
  };
}

describe('computePauseQualityScore', () => {
  it('zero for a bare instance with no events', () => {
    expect(
      computePauseQualityScore({
        instance: inst,
        template: tpl,
        stepEvents: [],
        companionEvents: [],
      }),
    ).toEqual({
      breath: 0,
      initial_emotion: 0,
      shift_emotion: 0,
      outcome: 0,
      companion: 0,
      note: 0,
      total: 0,
    });
  });

  it('100 for a fully-engaged pause with a long note', () => {
    const out = computePauseQualityScore({
      instance: inst,
      template: tpl,
      stepEvents: [
        step('breath_completed'),
        step('initial_emotion_logged', { mood: 'calm' }),
        step('shift_emotion_logged', { mood: 'calm' }),
        step('outcome_logged', { outcome: 'held' }),
        step('note_updated', { text: 'x'.repeat(120) }),
      ],
      companionEvents: [companion()],
    });
    expect(out.total).toBe(100);
    expect(out).toEqual({
      breath: PAUSE_QUALITY_WEIGHTS.breath,
      initial_emotion: PAUSE_QUALITY_WEIGHTS.initial_emotion,
      shift_emotion: PAUSE_QUALITY_WEIGHTS.shift_emotion,
      outcome: PAUSE_QUALITY_WEIGHTS.outcome,
      companion: PAUSE_QUALITY_WEIGHTS.companion,
      note: PAUSE_QUALITY_WEIGHTS.note,
      total: 100,
    });
  });

  it('awards half note credit for medium-length notes', () => {
    const out = computePauseQualityScore({
      instance: inst,
      template: tpl,
      stepEvents: [step('note_updated', { text: 'x'.repeat(25) })],
      companionEvents: [],
    });
    expect(out.note).toBe(Math.floor(PAUSE_QUALITY_WEIGHTS.note / 2));
    expect(out.total).toBe(Math.floor(PAUSE_QUALITY_WEIGHTS.note / 2));
  });

  it('awards no note credit for short notes', () => {
    const out = computePauseQualityScore({
      instance: inst,
      template: tpl,
      stepEvents: [step('note_updated', { text: 'hi' })],
      companionEvents: [],
    });
    expect(out.note).toBe(0);
  });

  it('with required_companion_count 0, companion quality credit requires at least one counted complete', () => {
    const steps = [
      step('breath_completed'),
      step('initial_emotion_logged', { mood: 'calm' }),
      step('shift_emotion_logged', { mood: 'calm' }),
      step('outcome_logged', { outcome: 'held' }),
    ];
    expect(
      computePauseQualityScore({
        instance: inst,
        template: tpl,
        stepEvents: steps,
        companionEvents: [],
      }).companion,
    ).toBe(0);
    expect(
      computePauseQualityScore({
        instance: inst,
        template: tpl,
        stepEvents: steps,
        companionEvents: [companion()],
      }).companion,
    ).toBe(PAUSE_QUALITY_WEIGHTS.companion);
  });

  it('companion credit is gated by template.required_companion_count when > 0', () => {
    const strictTpl: PauseTemplateRow = { ...tpl, slug: 'legacy', required_companion_count: 2 };
    const events: PauseCompanionEventRow[] = [companion()];
    const out1 = computePauseQualityScore({
      instance: inst,
      template: strictTpl,
      stepEvents: [],
      companionEvents: events,
    });
    expect(out1.companion).toBe(0);

    const out2 = computePauseQualityScore({
      instance: inst,
      template: strictTpl,
      stepEvents: [],
      companionEvents: [
        companion(),
        { ...companion(), companion_type: 'ground_nudge' },
      ],
    });
    expect(out2.companion).toBe(PAUSE_QUALITY_WEIGHTS.companion);
  });
});
