import { describe, it, expect } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import {
  initialDecisionFromRestored,
  initialFrameDoneFromRestored,
  initialPhaseFromRestored,
  mapPersistedStep,
} from './step-map';

describe('mapPersistedStep', () => {
  it('maps legacy and empty keys to feel', () => {
    expect(mapPersistedStep(undefined)).toBe('feel');
    expect(mapPersistedStep('pause')).toBe('feel');
  });

  it('maps legacy ground/shift to reflect/frame', () => {
    expect(mapPersistedStep('ground')).toBe('reflect');
    expect(mapPersistedStep('shift')).toBe('frame');
  });

  it('passes through known PauseStep values', () => {
    expect(mapPersistedStep('decide')).toBe('decide');
    expect(mapPersistedStep('breath2')).toBe('breath2');
  });

  it('maps removed choose step to decide for storage resume', () => {
    expect(mapPersistedStep('choose')).toBe('decide');
  });
});

describe('initialPhaseFromRestored', () => {
  it('defaults session when absent', () => {
    expect(initialPhaseFromRestored(null)).toBe('session');
    expect(initialPhaseFromRestored(makeTestPersistedPauseSession({ phase: undefined }))).toBe('session');
  });

  it('reads stored phase', () => {
    expect(initialPhaseFromRestored(makeTestPersistedPauseSession({ phase: 'done' }))).toBe('done');
  });
});

describe('initialDecisionFromRestored', () => {
  it('returns null when no session', () => {
    expect(initialDecisionFromRestored(null)).toBeNull();
  });

  it('defaults null when absent on row', () => {
    expect(initialDecisionFromRestored(makeTestPersistedPauseSession({ decision: undefined }))).toBeNull();
  });

  it('reads stored decision', () => {
    expect(initialDecisionFromRestored(makeTestPersistedPauseSession({ decision: 'hold' }))).toBe('hold');
  });
});

describe('initialFrameDoneFromRestored', () => {
  it('returns false when no session', () => {
    expect(initialFrameDoneFromRestored(null)).toBe(false);
  });

  it('reads stored flag with false default', () => {
    expect(initialFrameDoneFromRestored(makeTestPersistedPauseSession({}))).toBe(false);
    expect(initialFrameDoneFromRestored(makeTestPersistedPauseSession({ frameDone: true }))).toBe(true);
  });
});
