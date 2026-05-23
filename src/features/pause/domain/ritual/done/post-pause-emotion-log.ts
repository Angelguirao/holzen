import type { MoodValue } from '@/features/pause/domain/mood-value';

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
