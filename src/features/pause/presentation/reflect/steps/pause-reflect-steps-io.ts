import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { shouldShowFavoriteProHint } from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow';
import { shouldLogPauseReflectionStep } from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflection-step-flow';
import { runPauseFavoriteToggle } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import {
  reflectionStepSessionStorage,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

export { shouldLogPauseReflectionStep, shouldShowFavoriteProHint };
export { showPauseFavoriteProHintToast } from './pause-favorite-pro-hint-toast';

/** Default port + use case: reflect post-it tags commit. */
export function pauseReflectTagUpdate(
  input: { pauseInstanceId: string; tags: string[] },
): ReturnType<typeof runPauseReflectTagUpdate> {
  return runPauseReflectTagUpdate(supabasePauseRepository, input);
}

/** Default port + use case: reflect post-it note commit. */
export function pauseReflectNoteUpdate(
  input: { pauseInstanceId: string; text: string },
): ReturnType<typeof runPauseReflectNoteUpdate> {
  return runPauseReflectNoteUpdate(supabasePauseRepository, input);
}

/** Default port + use case: reflect heart favorite toggle. */
export function pauseReflectFavoriteToggle(
  input: { pauseInstanceId: string | null; isFavorite: boolean },
): ReturnType<typeof runPauseFavoriteToggle> {
  return runPauseFavoriteToggle(supabasePauseRepository, input);
}

/** Default port + storage: once-per-tab `reflection_step` log. */
export function pauseReflectionStepLogOnce(
  input: { pauseInstanceId: string },
): ReturnType<typeof runPauseReflectionStepLogOnce> {
  return runPauseReflectionStepLogOnce(supabasePauseRepository, input, {
    storage: reflectionStepSessionStorage,
  });
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseReflectTagUpdateWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string; tags: string[] },
): ReturnType<typeof runPauseReflectTagUpdate> {
  return runPauseReflectTagUpdate(repository, input);
}

export function pauseReflectNoteUpdateWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string; text: string },
): ReturnType<typeof runPauseReflectNoteUpdate> {
  return runPauseReflectNoteUpdate(repository, input);
}

export function pauseReflectFavoriteToggleWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; isFavorite: boolean },
): ReturnType<typeof runPauseFavoriteToggle> {
  return runPauseFavoriteToggle(repository, input);
}
