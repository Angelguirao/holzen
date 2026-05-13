import { describe, expect, it } from 'vitest';
import {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
} from '@/lib/pause-session-header-back';
import type {
  PauseHeaderBackIntentInput,
  PauseSessionHeaderBackInput,
} from '@/lib/pause-session-header-back';

const base = (over: Partial<PauseSessionHeaderBackInput> = {}): PauseSessionHeaderBackInput => ({
  phase: 'session',
  ritualEntry: 'deep',
  briefStep: 'feel',
  step: 'feel',
  breathTimedActive: false,
  breathingFirstCompleted: false,
  breathingSecondCompleted: false,
  ...over,
});

describe('isPauseSessionHeaderBackVisible', () => {
  it('is false when not in session phase', () => {
    expect(isPauseSessionHeaderBackVisible(base({ phase: 'done' }))).toBe(false);
  });

  it('brief: false on first macro step', () => {
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'feel', step: 'feel' }),
      ),
    ).toBe(false);
  });

  it('brief: false on breath step (wireframe: no back while breathing)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'breath' }))).toBe(
      false,
    );
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathTimedActive: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathingFirstCompleted: true }),
      ),
    ).toBe(false);
  });

  it('brief: never shows shell chevron (stepper-only navigation)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'integrate' }))).toBe(
      false,
    );
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'decide' }))).toBe(false);
  });

  it('deep: false on feel with no breath state', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'feel' }))).toBe(false);
  });

  it('deep: false on breathe and breath2 (wireframe: no back while breathing)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breathe' }))).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breathe', breathTimedActive: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breath2', breathingSecondCompleted: true }),
      ),
    ).toBe(false);
  });

  it('deep: true when past breathing steps', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'reflect' }))).toBe(true);
  });

  it('picker uses non-brief branch', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'feel' }))).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'breathe' }))).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'reflect' }))).toBe(true);
  });
});

const intentBase = (over: Partial<PauseHeaderBackIntentInput> = {}): PauseHeaderBackIntentInput => ({
  ritualEntry: 'deep',
  briefStep: 'feel',
  step: 'feel',
  breathTimedActive: false,
  breathingFirstCompleted: false,
  breathingSecondCompleted: false,
  ...over,
});

describe('computePauseHeaderBackIntent', () => {
  it('brief: breath timed segment resets intro only', () => {
    expect(
      computePauseHeaderBackIntent(
        intentBase({ ritualEntry: 'brief', briefStep: 'breath', breathTimedActive: true }),
      ),
    ).toEqual({ kind: 'brief_breath_reset_intro' });
  });

  it('brief: breath after completion resets intro and clears first flag', () => {
    expect(
      computePauseHeaderBackIntent(
        intentBase({ ritualEntry: 'brief', briefStep: 'breath', breathingFirstCompleted: true }),
      ),
    ).toEqual({ kind: 'brief_breath_reset_intro_clear_first' });
  });

  it('brief: otherwise ritual goBack', () => {
    expect(computePauseHeaderBackIntent(intentBase({ ritualEntry: 'brief', briefStep: 'feel' }))).toEqual({
      kind: 'go_back',
    });
  });

  it('deep: timed breathe or breath2 resets intro', () => {
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breathe', breathTimedActive: true })),
    ).toEqual({ kind: 'deep_breath_reset_intro' });
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breath2', breathTimedActive: true })),
    ).toEqual({ kind: 'deep_breath_reset_intro' });
  });

  it('deep: first segment done resets intro and clears first flag', () => {
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breathe', breathingFirstCompleted: true })),
    ).toEqual({ kind: 'deep_breathe_reset_intro_clear_first' });
  });

  it('deep: second segment done resets intro and clears second flag', () => {
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breath2', breathingSecondCompleted: true })),
    ).toEqual({ kind: 'deep_breath2_reset_intro_clear_second' });
  });

  it('deep: default is goBack', () => {
    expect(computePauseHeaderBackIntent(intentBase({ step: 'reflect' }))).toEqual({ kind: 'go_back' });
  });
});
