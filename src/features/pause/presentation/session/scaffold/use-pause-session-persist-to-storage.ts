import { useEffect } from 'react';
import {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from '@/features/pause/public-session';
import { hasPersistablePauseSessionAnchor } from '@/features/pause/domain/session/persisted-session-guards';
import { savePausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

/** Autosave ritual fields to `holzen_pause_session` when we have an instance id and/or reflection copy. */
export function usePauseSessionPersistToStorage(p: PauseSessionPersistSnapshotInput): void {
  useEffect(() => {
    if (!hasPersistablePauseSessionAnchor(p.pauseInstanceId, p.message)) return;
    savePausePersistedTabSession(buildPauseSessionPersistSnapshot(p));
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
    p.ritualEntry,
    p.briefStep,
    p.briefIntegrateDone,
    p.selectedBriefFace,
  ]);
}
