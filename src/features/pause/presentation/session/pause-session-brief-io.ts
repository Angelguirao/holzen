/**
 * Presentation I/O for `/pause` brief ritual depth upgrade RPC and brief hydration from storage.
 * Imports restored brief fields and depth-upgrade RPC via sibling application modules
 * (parity with `pause-session-scaffold-io` → scaffold subcluster modules).
 * Parity pins (colocated): `pause-session-brief-io.re-exports.test.ts`, `pause-session-brief-io-parity.test.ts`.
 */
import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from '@/features/pause/application/use-cases/session/restored-brief-ritual-state';
import { initialRitualEntry } from '@/features/pause/application/use-cases/session/initial-ritual-entry';
import { logPauseRitualDepthUpgraded } from '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
};

/** Default `PauseRepository` for session brief presentation hooks. */
export const briefPauseRepository = supabasePauseRepository;

/** Default port + use case: brief → deep `ritual_depth_upgraded` step log. */
export function pauseBriefRitualDepthUpgraded(
  pauseInstanceId: string,
): ReturnType<typeof logPauseRitualDepthUpgraded> {
  return logPauseRitualDepthUpgraded(briefPauseRepository, pauseInstanceId);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseBriefRitualDepthUpgradedWithRepository(
  repository: PauseRepository,
  pauseInstanceId: string,
): ReturnType<typeof logPauseRitualDepthUpgraded> {
  return logPauseRitualDepthUpgraded(repository, pauseInstanceId);
}
