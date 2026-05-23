import type { PauseLogCompanionResult } from '@/features/pause/domain/rpc-types';
import type { PauseCompanionAction } from '@/features/pause/domain/pause-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** Application use case: `pause_log_companion` via repository port. */
export async function logPauseCompanion(
  repository: PauseRepository,
  params: {
    instanceId: string | null;
    companionType: string;
    action: PauseCompanionAction;
    entryPoint: string;
  },
): Promise<PauseLogCompanionResult> {
  return repository.logCompanion(params);
}
