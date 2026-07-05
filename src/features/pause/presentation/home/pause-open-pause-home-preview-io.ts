import { runPauseDismissCurrent } from '@/features/pause/application/use-cases/session/run-pause-dismiss-current';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export { runPauseDismissCurrent } from '@/features/pause/application/use-cases/session/run-pause-dismiss-current';

export const pauseOpenPreviewRepository = supabasePauseRepository;

export function pauseCommitOpenPauseDismissRpc(
  repository: PauseRepository = pauseOpenPreviewRepository,
): ReturnType<typeof runPauseDismissCurrent> {
  return runPauseDismissCurrent(repository);
}
