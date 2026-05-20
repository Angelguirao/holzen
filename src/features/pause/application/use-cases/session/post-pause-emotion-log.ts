import type { MoodValue } from '@/features/pause/domain/mood-value';
import { PAUSE_MOOD_VALUES } from '@/features/pause/domain/mood-value';

export function isPauseMoodValue(s: string | null | undefined): s is MoodValue {
  return s != null && (PAUSE_MOOD_VALUES as readonly string[]).includes(s);
}

/** Payload for `pauseLogStep` with `stepType: 'post_pause_emotion_logged'` (after `outcome_logged`). */
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

type LogPostPauseEmotionStepPort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<void>;

/** Brief done “Save to journey” — logs only when feel check-in changed from ritual snapshot. */
export async function runPostPauseEmotionLogIfDirty(
  input: {
    pauseInstanceId: string | null;
    mood: MoodValue | null;
    intensity: number;
    initialSnapshot: PostPauseFeelSnapshot | null;
  },
  ports: { logStep: LogPostPauseEmotionStepPort },
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
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: buildPostPauseEmotionLoggedPayload(input.mood, input.intensity),
    });
    return { status: 'logged' };
  } catch {
    return { status: 'sync_failed' };
  }
}
