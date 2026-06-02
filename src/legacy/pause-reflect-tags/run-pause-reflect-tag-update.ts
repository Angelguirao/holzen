import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import { reflectPauseRepository } from '@/features/pause/infrastructure/supabase-pause-repository';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { buildReflectTagUpdatedPayload } from './tag-payloads';

export type RunPauseReflectTagUpdateResult =
  | { status: 'success' }
  | { status: 'sync_failed' };

/** Legacy Reflect tags commit — `tag_updated` step. */
export async function runPauseReflectTagUpdate(
  repository: PauseRepository,
  input: { pauseInstanceId: string; tags: string[] },
): Promise<RunPauseReflectTagUpdateResult> {
  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'tag_updated',
      payload: buildReflectTagUpdatedPayload(input.tags),
    });
    return { status: 'success' };
  } catch {
    return { status: 'sync_failed' };
  }
}

export async function runPauseReflectTagUpdateDefault(input: {
  pauseInstanceId: string;
  tags: string[];
}): Promise<RunPauseReflectTagUpdateResult> {
  return runPauseReflectTagUpdate(reflectPauseRepository, input);
}
