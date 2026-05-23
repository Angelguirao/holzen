import type { MoodValue } from '@/features/pause/domain/mood-value';
import {
  buildPostPauseEmotionLoggedPayload,
  isPostPauseEmotionDirty,
  type PostPauseFeelSnapshot,
} from '@/features/pause/domain/ritual/done/post-pause-emotion-log';
import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type { PostPauseFeelSnapshot } from '@/features/pause/domain/ritual/done/post-pause-emotion-log';

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
