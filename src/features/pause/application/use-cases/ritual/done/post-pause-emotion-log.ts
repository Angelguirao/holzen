import type { MoodValue } from '@/features/pause/domain/mood-value';
import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** Payload for `pause_log_step` with `stepType: 'post_pause_emotion_logged'` (after `outcome_logged`). */
export function buildPostPauseEmotionLoggedPayload(
  mood: MoodValue,
  intensity: number,
): Record<string, unknown> {
  return { mood, intensity };
}

export type PostPauseFeelSnapshot = {
  mood: MoodValue | null;
  intensity: number;
};

export function isPostPauseEmotionDirty(
  current: { mood: MoodValue; intensity: number },
  initial: PostPauseFeelSnapshot | null,
): boolean {
  if (!initial) return true;
  return current.mood !== initial.mood || current.intensity !== initial.intensity;
}

export type RunPostPauseEmotionLogResult =
  | { status: 'skipped' }
  | { status: 'logged' }
  | { status: 'sync_failed' };

/** Brief done “Save to journey” — logs only when feel check-in changed from ritual snapshot. */
export async function runPostPauseEmotionLogIfDirty(
  repository: PauseRepository,
  input: {
    pauseInstanceId: string | null;
    mood: MoodValue | null;
    intensity: number;
    initialSnapshot: PostPauseFeelSnapshot | null;
  },
): Promise<RunPostPauseEmotionLogResult> {
  if (!input.pauseInstanceId || input.mood == null) {
    return { status: 'skipped' };
  }

  if (
    !isPostPauseEmotionDirty(
      { mood: input.mood, intensity: input.intensity },
      input.initialSnapshot,
    )
  ) {
    return { status: 'skipped' };
  }

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'post_pause_emotion_logged',
      payload: buildPostPauseEmotionLoggedPayload(input.mood, input.intensity),
    });
    return { status: 'logged' };
  } catch {
    return { status: 'sync_failed' };
  }
}
