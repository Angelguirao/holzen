/**
 * Presentation I/O for `/pause` brief ritual depth upgrade RPC and brief hydration from storage.
 * Session brief hooks import here instead of deep `application/use-cases/*`.
 */
import { logPauseRitualDepthUpgraded } from '@/features/pause/application/use-cases/session/pause-session-brief-flow';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
} from '@/features/pause/application/use-cases/session/pause-session-brief-flow';

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
