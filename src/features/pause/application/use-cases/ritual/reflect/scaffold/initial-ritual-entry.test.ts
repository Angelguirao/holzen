import { describe, it, expect } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import { initialRitualEntry } from './initial-ritual-entry';

describe('initialRitualEntry', () => {
  it('returns picker when no session or no message', () => {
    expect(initialRitualEntry(null)).toBe('picker');
    expect(initialRitualEntry(makeTestPersistedPauseSession({ message: '' }))).toBe('picker');
  });

  it('returns stored ritualDepth when set', () => {
    expect(initialRitualEntry(makeTestPersistedPauseSession({ ritualDepth: 'brief' }))).toBe('brief');
    expect(initialRitualEntry(makeTestPersistedPauseSession({ ritualDepth: 'deep' }))).toBe('deep');
  });

  it('infers deep when user already progressed without explicit ritualDepth', () => {
    expect(initialRitualEntry(makeTestPersistedPauseSession({ moodDone: true }))).toBe('deep');
    expect(initialRitualEntry(makeTestPersistedPauseSession({ phase: 'done' }))).toBe('deep');
    expect(initialRitualEntry(makeTestPersistedPauseSession({ step: 'breathe' }))).toBe('deep');
  });

  it('returns picker at feel start with message only', () => {
    expect(initialRitualEntry(makeTestPersistedPauseSession({}))).toBe('picker');
  });
});
