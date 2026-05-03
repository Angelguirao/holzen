import { useEffect } from 'react';
import { saveSession } from '@/lib/pause-session-storage';
import {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from '@/lib/pause-session-persist-snapshot';

/** Autosave current pause ritual fields to `holzen_pause_session` when `message` is non-empty. */
export function usePauseSessionPersistToStorage(p: PauseSessionPersistSnapshotInput): void {
  useEffect(() => {
    if (!p.message) return;
    saveSession(buildPauseSessionPersistSnapshot(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- list snapshot fields, not `p` (caller passes a new object each render).
  }, [
    p.message,
    p.context,
    p.pauseInstanceId,
    p.companions,
    p.companionPrefs,
    p.severity,
    p.moodDone,
    p.moodAfterDone,
    p.selectedMood,
    p.selectedMoodAfter,
    p.feelIntensity,
    p.shiftIntensity,
    p.phase,
    p.decision,
    p.step,
    p.breathingFirstCompleted,
    p.breathingSecondCompleted,
    p.frameDone,
    p.decideOnBackStep,
    p.ritualEntry,
    p.briefStep,
    p.briefIntegrateDone,
    p.selectedBriefFace,
  ]);
}
