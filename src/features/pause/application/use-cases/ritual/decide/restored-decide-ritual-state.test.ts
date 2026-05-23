import { describe, it, expect } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from './restored-decide-ritual-state';

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
