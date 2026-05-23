import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import { buildReflectNoteUpdatedPayload } from '@/features/pause/domain/reflect/steps/reflect-step-payloads';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type RunPauseReflectNoteUpdateResult =
  | { status: 'success' }
  | { status: 'sync_failed' };

/** Reflect post-it note blur — `note_updated` step. */
export async function runPauseReflectNoteUpdate(
  repository: PauseRepository,
  input: { pauseInstanceId: string; text: string },
): Promise<RunPauseReflectNoteUpdateResult> {
  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'note_updated',
      payload: buildReflectNoteUpdatedPayload(input.text),
    });
    return { status: 'success' };
  } catch {
    return { status: 'sync_failed' };
  }
}
