import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { initialRitualEntry } from '@/features/pause/application/use-cases/session/initial-ritual-entry';

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
