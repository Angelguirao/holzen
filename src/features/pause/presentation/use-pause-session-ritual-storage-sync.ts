import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { loadSession } from '@/features/pause/infrastructure/session/persisted-session-storage';
import { computePauseStorageRitualSyncPatch } from '@/features/pause/application/use-cases/session/storage-ritual-sync';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/public-hooks';
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
    const patch = computePauseStorageRitualSyncPatch(pauseInstanceId, loadSession());
    if (!patch) return;
    setRitualEntry(patch.ritualEntry);
    if (patch.briefStep !== undefined) setBriefStep(patch.briefStep);
    setBriefIntegrateDone(patch.briefIntegrateDone);
    setSelectedBriefFace(patch.selectedBriefFace);
  }, [pauseInstanceId, setRitualEntry, setBriefStep, setBriefIntegrateDone, setSelectedBriefFace]);
}
