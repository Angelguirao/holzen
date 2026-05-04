import { describe, expect, it } from 'vitest';
import { buildPauseSessionPersistSnapshot } from '@/lib/pause-session-persist-snapshot';
import type { PauseSessionPersistSnapshotInput } from '@/lib/pause-session-persist-snapshot';

const companions = { haiku: null, groundingTitle: null, groundingBody: null } as const;
const companionPrefs = {
  breathing: true,
  haiku: true,
  grounding: true,
  signal: true,
  zoomOut: true,
  history: true,
} as const;

const base = (over: Partial<PauseSessionPersistSnapshotInput> = {}): PauseSessionPersistSnapshotInput => ({
  message: 'hello',
  context: 'ctx',
  pauseInstanceId: 'pi-1',
  companions,
  companionPrefs,
  severity: 'mild',
  moodDone: false,
  moodAfterDone: false,
  selectedMood: null,
  selectedMoodAfter: null,
  feelIntensity: null,
  shiftIntensity: null,
  phase: 'session',
  decision: null,
  step: 'feel',
  breathingFirstCompleted: false,
  breathingSecondCompleted: false,
  frameDone: false,
  decideOnBackStep: 'choose',
  ritualEntry: 'picker',
  briefStep: 'feel',
  briefIntegrateDone: false,
  selectedBriefFace: null,
  ...over,
});

describe('buildPauseSessionPersistSnapshot', () => {
  it('omits ritualDepth when entry is picker', () => {
    const s = buildPauseSessionPersistSnapshot(base({ ritualEntry: 'picker' }));
    expect(s.ritualDepth).toBeUndefined();
    expect(s.briefStep).toBeUndefined();
    expect(s.briefIntegrateDone).toBeUndefined();
    expect(s.briefFace).toBeUndefined();
  });

  it('includes ritualDepth deep and clears brief-only keys', () => {
    const s = buildPauseSessionPersistSnapshot(
      base({
        ritualEntry: 'deep',
        briefStep: 'integrate',
        briefIntegrateDone: true,
        selectedBriefFace: 'calm',
      }),
    );
    expect(s.ritualDepth).toBe('deep');
    expect(s.briefStep).toBeUndefined();
    expect(s.briefIntegrateDone).toBeUndefined();
    expect(s.briefFace).toBeUndefined();
  });

  it('includes brief fields only when ritualEntry is brief', () => {
    const s = buildPauseSessionPersistSnapshot(
      base({
        ritualEntry: 'brief',
        briefStep: 'breath',
        briefIntegrateDone: true,
        selectedBriefFace: 'anxious',
      }),
    );
    expect(s.ritualDepth).toBe('brief');
    expect(s.briefStep).toBe('breath');
    expect(s.briefIntegrateDone).toBe(true);
    expect(s.briefFace).toBe('anxious');
  });

  it('omits briefFace when brief but face is null', () => {
    const s = buildPauseSessionPersistSnapshot(
      base({ ritualEntry: 'brief', briefStep: 'feel', selectedBriefFace: null }),
    );
    expect(s.briefFace).toBeUndefined();
  });
});
