import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** RPC payload + dedupe key for Frame hub “I'm done” → `shift_emotion_logged`. */
export function buildShiftEmotionFrameHubLogBundle(): {
  payload: Record<string, unknown>;
  logKey: string;
} {
  const payload: Record<string, unknown> = { from_frame_hub: true };
  return { payload, logKey: JSON.stringify(payload) };
}

export type RunShiftEmotionFrameHubDoneResult =
  | { status: 'advance'; logKey: string }
  | { status: 'sync_failed' };

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
