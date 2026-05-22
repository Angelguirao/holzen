/**
 * Ritual done presentation I/O (brief post-pause emotion log when feel changed).
 * Imports done use cases via `pause-ritual-done-flow` CI anchor (parity with reflect mood I/O peels).
 */
import { runPostPauseEmotionLogIfDirty } from '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export type { PostPauseFeelSnapshot } from '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow';

/** Default `PauseRepository` for ritual done presentation hooks. */
export const reflectPauseRepository = supabasePauseRepository;

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
