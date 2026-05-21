/**
 * Presentation I/O for `/pause` brief ritual depth upgrade RPC and brief hydration from storage.
 * Imports restored brief fields from `session/` + `ritual/brief/` (off `pause-session-brief-flow` CI anchor).
 */
import { logPauseRitualDepthUpgraded } from '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade';
import { initialRitualEntry } from '@/features/pause/application/use-cases/session/initial-ritual-entry';
import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from '@/features/pause/application/use-cases/session/restored-brief-ritual-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
};

/** Default port + use case: brief → deep `ritual_depth_upgraded` step log. */
export function pauseBriefRitualDepthUpgraded(
  pauseInstanceId: string,
): ReturnType<typeof logPauseRitualDepthUpgraded> {
  return logPauseRitualDepthUpgraded(supabasePauseRepository, pauseInstanceId);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseBriefRitualDepthUpgradedWithRepository(
  repository: PauseRepository,
  pauseInstanceId: string,
): ReturnType<typeof logPauseRitualDepthUpgraded> {
  return logPauseRitualDepthUpgraded(repository, pauseInstanceId);
}
