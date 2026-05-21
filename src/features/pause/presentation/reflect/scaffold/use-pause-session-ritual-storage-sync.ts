import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { computePauseStorageRitualSyncPatch } from '@/features/pause/application/use-cases/ritual/reflect/scaffold/storage-ritual-sync';
import { loadPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';

/**
 * When `pauseInstanceId` resolves, re-align brief/deep ritual UI from `holzen_pause_session` if it still matches that instance.
 */
export function usePauseSessionRitualStorageSync(input: {
  pauseInstanceId: string | null;
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setSelectedBriefFace: Dispatch<SetStateAction<FeelStepTile | null>>;
}): void {
  const { pauseInstanceId, setRitualEntry, setBriefStep, setBriefIntegrateDone, setSelectedBriefFace } = input;

  useEffect(() => {
    if (!pauseInstanceId) return;
    const patch = computePauseStorageRitualSyncPatch(
      pauseInstanceId,
      loadPausePersistedTabSession(),
    );
    if (!patch) return;
    setRitualEntry(patch.ritualEntry);
    if (patch.briefStep !== undefined) setBriefStep(patch.briefStep);
    setBriefIntegrateDone(patch.briefIntegrateDone);
    setSelectedBriefFace(patch.selectedBriefFace);
  }, [pauseInstanceId, setRitualEntry, setBriefStep, setBriefIntegrateDone, setSelectedBriefFace]);
}
