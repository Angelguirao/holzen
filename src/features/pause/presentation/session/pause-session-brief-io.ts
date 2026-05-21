import { logPauseRitualDepthUpgraded } from '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

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
