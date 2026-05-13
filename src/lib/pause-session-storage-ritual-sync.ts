import type { FeelStepTile } from '@/components/pause/pause-feel-types';
import type { BriefPauseStep, PersistedSession, RitualDepth } from '@/lib/pause-session-storage';
import { initialRitualEntry } from '@/lib/pause-session-step-map';

/**
 * State updates to apply when `pauseInstanceId` changes and local storage
 * still belongs to that instance (or has no instance id yet).
 * Mirrors the prior inline `useEffect` in `PauseSession`.
 */
export type PauseStorageRitualSyncPatch = {
  ritualEntry: RitualDepth | 'picker';
  /** When `undefined`, callers must not call `setBriefStep` (preserve React state). */
  briefStep: BriefPauseStep | undefined;
  briefIntegrateDone: boolean;
  selectedBriefFace: FeelStepTile | null;
};

export function computePauseStorageRitualSyncPatch(
  pauseInstanceId: string | null,
  saved: PersistedSession | null,
): PauseStorageRitualSyncPatch | null {
  if (!pauseInstanceId) return null;
  if (saved?.pauseInstanceId && saved.pauseInstanceId !== pauseInstanceId) return null;

  let briefStep: BriefPauseStep | undefined;
  if (saved?.ritualDepth === 'brief' && saved.briefStep) briefStep = saved.briefStep;
  else if (saved?.ritualDepth !== 'brief') briefStep = 'feel';

  return {
    ritualEntry: initialRitualEntry(saved),
    briefStep,
    briefIntegrateDone: saved?.briefIntegrateDone ?? false,
    selectedBriefFace: saved?.briefFace ?? null,
  };
}
