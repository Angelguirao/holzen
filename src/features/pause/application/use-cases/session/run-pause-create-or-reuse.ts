import type { PauseCreateOrReuseResult } from '@/features/pause/domain/rpc-types';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** Application use case: open or reuse a pause instance via `pause_create_or_reuse`. */
export async function runPauseCreateOrReuse(
  repository: PauseRepository,
  params: Parameters<PauseRepository['createOrReuse']>[0],
): Promise<PauseCreateOrReuseResult> {
  return repository.createOrReuse(params);
}
