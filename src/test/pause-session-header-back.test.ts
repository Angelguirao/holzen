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

  it('brief: back chevron only on Breathe (to return to Feel)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'brief', briefStep: 'breath' }))).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathTimedActive: true }),
      ),
    ).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'brief', briefStep: 'breath', breathingFirstCompleted: true }),
      ),
    ).toBe(true);
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

  it('deep: shell back on first Breathe (same affordance as brief; back to Feel)', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breathe' }))).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breathe', breathTimedActive: true }),
      ),
    ).toBe(true);
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breathe', breathingFirstCompleted: true }),
      ),
    ).toBe(true);
  });

  it('deep: no shell back on second Breathe', () => {
    expect(
      isPauseSessionHeaderBackVisible(
        base({ ritualEntry: 'deep', step: 'breath2', breathingSecondCompleted: true }),
      ),
    ).toBe(false);
    expect(
      isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'breath2', breathTimedActive: true })),
    ).toBe(false);
  });

  it('deep: true when past breathing steps', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'deep', step: 'reflect' }))).toBe(true);
  });

  it('picker uses non-brief branch', () => {
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'feel' }))).toBe(false);
    expect(isPauseSessionHeaderBackVisible(base({ ritualEntry: 'picker', step: 'breathe' }))).toBe(true);
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
