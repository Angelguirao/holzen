import type { PauseState } from '@/features/pause/domain/pause-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** Application use case: dismiss the user's current open pause via `pause_dismiss_current`. */
export async function runPauseDismissCurrent(
  repository: PauseRepository,
): Promise<PauseState | null> {
  return repository.dismissCurrent();
}
