import { describe, it, expect } from 'vitest';
import {
  mapPersistedStep,
  initialRitualEntry,
  initialBriefPauseStepFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialSelectedBriefFaceFromRestored,
  initialPhaseFromRestored,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  briefStepToPauseScienceStep,
} from '@/lib/pause-session-step-map';
import type { PersistedSession } from '@/lib/pause-session-storage';

function baseSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    message: 'hello',
    context: null,
    pauseInstanceId: 'p1',
    companions: {
      haiku: null,
      groundingTitle: null,
      groundingBody: null,
    },
    companionPrefs: {
      breathing: true,
      haiku: true,
      grounding: true,
      signal: true,
      zoomOut: true,
      history: true,
    },
    severity: 'mild',
    moodDone: false,
    moodAfterDone: false,
    phase: 'session',
    decision: null,
    step: 'feel',
    ...overrides,
  };
}

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
});

describe('initialRitualEntry', () => {
  it('returns picker when no session or no message', () => {
    expect(initialRitualEntry(null)).toBe('picker');
    expect(initialRitualEntry(baseSession({ message: '' }))).toBe('picker');
  });

  it('returns stored ritualDepth when set', () => {
    expect(initialRitualEntry(baseSession({ ritualDepth: 'brief' }))).toBe('brief');
    expect(initialRitualEntry(baseSession({ ritualDepth: 'deep' }))).toBe('deep');
  });

  it('infers deep when user already progressed without explicit ritualDepth', () => {
    expect(initialRitualEntry(baseSession({ moodDone: true }))).toBe('deep');
    expect(initialRitualEntry(baseSession({ phase: 'done' }))).toBe('deep');
    expect(initialRitualEntry(baseSession({ step: 'breathe' }))).toBe('deep');
  });

  it('returns picker at feel start with message only', () => {
    expect(initialRitualEntry(baseSession({}))).toBe('picker');
  });
});

describe('initialBriefPauseStepFromRestored', () => {
  it('defaults to feel when no session or not a brief ritual', () => {
    expect(initialBriefPauseStepFromRestored(null)).toBe('feel');
    expect(initialBriefPauseStepFromRestored(baseSession({ ritualDepth: 'deep' }))).toBe('feel');
    expect(initialBriefPauseStepFromRestored(baseSession({}))).toBe('feel');
  });

  it('uses stored briefStep when ritual is brief', () => {
    expect(
      initialBriefPauseStepFromRestored(
        baseSession({ ritualDepth: 'brief', briefStep: 'integrate' }),
      ),
    ).toBe('integrate');
  });

  it('falls back to feel when brief ritual has no briefStep', () => {
    expect(initialBriefPauseStepFromRestored(baseSession({ ritualDepth: 'brief' }))).toBe('feel');
  });
});

describe('initialBriefIntegrateDoneFromRestored', () => {
  it('defaults false when absent', () => {
    expect(initialBriefIntegrateDoneFromRestored(null)).toBe(false);
    expect(initialBriefIntegrateDoneFromRestored(baseSession({}))).toBe(false);
  });

  it('reads stored flag', () => {
    expect(
      initialBriefIntegrateDoneFromRestored(baseSession({ ritualDepth: 'brief', briefIntegrateDone: true })),
    ).toBe(true);
  });
});

describe('initialSelectedBriefFaceFromRestored', () => {
  it('defaults null when absent', () => {
    expect(initialSelectedBriefFaceFromRestored(null)).toBeNull();
    expect(initialSelectedBriefFaceFromRestored(baseSession({}))).toBeNull();
  });

  it('reads stored briefFace', () => {
    expect(
      initialSelectedBriefFaceFromRestored(baseSession({ ritualDepth: 'brief', briefFace: 'anxious' })),
    ).toBe('anxious');
  });
});

describe('initialPhaseFromRestored', () => {
  it('defaults session when absent', () => {
    expect(initialPhaseFromRestored(null)).toBe('session');
    expect(initialPhaseFromRestored(baseSession({ phase: undefined }))).toBe('session');
  });

  it('reads stored phase', () => {
    expect(initialPhaseFromRestored(baseSession({ phase: 'done' }))).toBe('done');
  });
});

describe('briefStepToPauseScienceStep', () => {
  it('maps brief steps to deep stepper keys for science sheet', () => {
    expect(briefStepToPauseScienceStep('feel')).toBe('feel');
    expect(briefStepToPauseScienceStep('breath')).toBe('breathe');
    expect(briefStepToPauseScienceStep('integrate')).toBe('reflect');
    expect(briefStepToPauseScienceStep('decide')).toBe('decide');
  });
});

describe('initialBreathSegmentRpcLoggedFlagsFromRestored', () => {
  it('treats no restore as no segments logged', () => {
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(null)).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
  });

  it('is false at feel; segment1 after breathe; both after breath2', () => {
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(baseSession({ step: 'feel' }))).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(baseSession({ step: 'reflect' }))).toEqual({
      segment1Logged: true,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(baseSession({ step: 'choose' }))).toEqual({
      segment1Logged: true,
      segment2Logged: true,
    });
  });

  it('matches legacy persisted step mapping before comparing indices', () => {
    expect(
      initialBreathSegmentRpcLoggedFlagsFromRestored(baseSession({ step: 'ground' as unknown as PersistedSession['step'] })),
    ).toEqual({
      segment1Logged: true,
      segment2Logged: false,
    });
  });
});
