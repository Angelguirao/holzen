import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type ToggleCompanionLibraryFavoriteInput = {
  pauseInstanceId: string;
  sourceType: string;
  /** Client-computed favorites map after toggling `sourceType`. */
  nextBucket: Record<string, boolean>;
  onBucketComputed?: (bucket: Record<string, boolean>) => void;
};

/** Companion slot heart — `pause_instances.metadata` via `PauseRepository` (not `pause_log_step`). */
export async function runToggleCompanionLibraryFavorite(
  repository: PauseRepository,
  input: ToggleCompanionLibraryFavoriteInput,
): Promise<boolean> {
  return repository.toggleCompanionSlotFavorite({
    pauseInstanceId: input.pauseInstanceId,
    nextBucket: input.nextBucket,
    onBucketComputed: input.onBucketComputed,
  });
}
