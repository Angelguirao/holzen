import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type RunPauseReflectTagUpdateResult =
  | { status: 'success' }
  | { status: 'sync_failed' };

/** Reflect tags commit — `tag_updated` step. */
export async function runPauseReflectTagUpdate(
  repository: PauseRepository,
  input: { pauseInstanceId: string; tags: string[] },
): Promise<RunPauseReflectTagUpdateResult> {
  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'tag_updated',
      payload: { tags: input.tags },
    });
    return { status: 'success' };
  } catch {
    return { status: 'sync_failed' };
  }
}
