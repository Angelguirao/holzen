import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import { reflectionStepLoggedStorageKey } from '@/features/pause/domain/reflection-step-log';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { ReflectionStepLogStoragePort } from '@/features/pause/ports/reflection-step-log-storage';

export type RunPauseReflectionStepLogResult =
  | { status: 'logged' }
  | { status: 'already_logged' }
  | { status: 'storage_unavailable' }
  | { status: 'sync_failed' };

/**
 * Once per pause instance per tab — `reflection_step` after reflect copy is ready or failed.
 * Non-fatal on RPC error (caller may retry on revisit).
 */
export async function runPauseReflectionStepLogOnce(
  repository: PauseRepository,
  input: { pauseInstanceId: string },
  ports: { storage: ReflectionStepLogStoragePort },
): Promise<RunPauseReflectionStepLogResult> {
  if (!ports.storage.canRead()) {
    return { status: 'storage_unavailable' };
  }

  const storageKey = reflectionStepLoggedStorageKey(input.pauseInstanceId);
  if (ports.storage.isLogged(storageKey)) {
    return { status: 'already_logged' };
  }

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'reflection_step',
      payload: { surface: 'pause_reflect' },
    });
    ports.storage.markLogged(storageKey);
    return { status: 'logged' };
  } catch {
    return { status: 'sync_failed' };
  }
}
