import { runPostPauseEmotionLogIfDirty } from '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/** Default port + use case: brief done post-pause emotion log when feel changed. */
export function pausePostPauseEmotionLogIfDirty(
  input: Parameters<typeof runPostPauseEmotionLogIfDirty>[1],
): ReturnType<typeof runPostPauseEmotionLogIfDirty> {
  return runPostPauseEmotionLogIfDirty(supabasePauseRepository, input);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pausePostPauseEmotionLogIfDirtyWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runPostPauseEmotionLogIfDirty>[1],
): ReturnType<typeof runPostPauseEmotionLogIfDirty> {
  return runPostPauseEmotionLogIfDirty(repository, input);
}
