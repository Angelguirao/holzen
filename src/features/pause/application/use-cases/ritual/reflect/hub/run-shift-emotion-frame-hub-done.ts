import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import { buildShiftEmotionFrameHubLogBundle } from './pause-reflect-hub-flow';
import type { ShiftEmotionFrameHubDoneOutcome } from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type RunShiftEmotionFrameHubDoneResult = ShiftEmotionFrameHubDoneOutcome;

/** Frame hub “I'm done”: deduped `shift_emotion_logged` then advance to second breath. */
export async function runShiftEmotionFrameHubDone(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; lastShiftLogKey: string | null },
): Promise<RunShiftEmotionFrameHubDoneResult> {
  const { payload, logKey } = buildShiftEmotionFrameHubLogBundle();

  if (!input.pauseInstanceId) {
    return { status: 'advance', logKey };
  }

  if (input.lastShiftLogKey === logKey) {
    return { status: 'advance', logKey };
  }

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'shift_emotion_logged',
      payload,
    });
    return { status: 'advance', logKey };
  } catch {
    return { status: 'sync_failed' };
  }
}
