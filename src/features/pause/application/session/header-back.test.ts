import { describe, expect, it } from 'vitest';
import {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
} from '@/features/pause/public';
import type {
  PauseHeaderBackIntentInput,
  PauseSessionHeaderBackInput,
} from '@/features/pause/public';

const base = (over: Partial<PauseSessionHeaderBackInput> = {}): PauseSessionHeaderBackInput => ({
  phase: 'session',
  ritualEntry: 'deep',
  briefStep: 'feel',
  step: 'feel',
  breathTimedActive: false,
  breathFirstTimedPatternStarted: false,
  breathSecondTimedPatternStarted: false,
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

  it('brief: shell back only on Breathe intro (before timed pattern starts)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'breath' }))).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathFirstTimedPatternStarted: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({
          ritualEntry: 'brief',
          briefStep: 'breath',
          breathFirstTimedPatternStarted: true,
          breathTimedActive: true,
        }),
      ),
    ).toBe(false);
  });

  it('brief: no shell back on Feel, Integrate, or Decide', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'integrate' }))).toBe(
      false,
    );
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'decide' }))).toBe(false);
  });

  it('deep: false on feel with no breath state', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'feel' }))).toBe(false);
  });

  it('deep: shell back on first Breathe intro only (hide after Start / interstitial)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breathe' }))).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breathe', breathFirstTimedPatternStarted: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({
          ritualEntry: 'deep',
          step: 'breathe',
          breathFirstTimedPatternStarted: true,
          breathingFirstCompleted: true,
        }),
      ),
    ).toBe(false);
  });

  it('deep: shell back on second Breathe intro only (hide after Start / interstitial)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breath2' }))).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breath2', breathSecondTimedPatternStarted: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(
        base({
          ritualEntry: 'deep',
          step: 'breath2',
          breathSecondTimedPatternStarted: false,
          breathTimedActive: false,
          breathingSecondCompleted: true,
        }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breath2', breathTimedActive: true })),
    ).toBe(false);
  });

  it('deep: no shell back on Reflect (wireframe: back from Frame to revisit notes)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'reflect' }))).toBe(false);
  });

  it('deep: shell back from Frame onward (back target is Reflect)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'frame' }))).toBe(true);
  });

  it('deep: shell back on second Breathe intro (before timed pattern)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breath2' }))).toBe(true);
  });

  it('deep: no shell back on Decide (parity with brief)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'decide' }))).toBe(false);
  });

  it('picker uses non-brief branch', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'feel' }))).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'breathe' }))).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'picker', step: 'breathe', breathFirstTimedPatternStarted: true }),
      ),
    ).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'reflect' }))).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'frame' }))).toBe(true);
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
  it('brief: header back always uses ritual goBack (e.g. Breathe → Feel)', () => {
    expect(
      computePauseHeaderBackIntent(
        intentBase({ ritualEntry: 'brief', briefStep: 'breath', breathTimedActive: true }),
      ),
    ).toEqual({ kind: 'go_back' });
    expect(
      computePauseHeaderBackIntent(
        intentBase({ ritualEntry: 'brief', briefStep: 'breath', breathingFirstCompleted: true }),
      ),
    ).toEqual({ kind: 'go_back' });
    expect(computePauseHeaderBackIntent(intentBase({ ritualEntry: 'brief', briefStep: 'breath' }))).toEqual({
      kind: 'go_back',
    });
  });

  it('deep: first Breathe always uses ritual goBack (match brief)', () => {
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breathe', breathTimedActive: true })),
    ).toEqual({ kind: 'go_back' });
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breathe', breathingFirstCompleted: true })),
    ).toEqual({ kind: 'go_back' });
    expect(computePauseHeaderBackIntent(intentBase({ step: 'breathe' }))).toEqual({ kind: 'go_back' });
  });

  it('deep: timed second Breathe resets intro', () => {
    expect(
      computePauseHeaderBackIntent(intentBase({ step: 'breath2', breathTimedActive: true })),
    ).toEqual({ kind: 'deep_breath_reset_intro' });
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
