import type { MoodValue } from '@/features/pause/public';
import { PAUSE_MOOD_VALUES } from '@/features/pause/public';

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
