import type { MoodValue } from '@/features/pause/domain/mood-value';

/** Frame exit without naming a shift mood (required to advance; no shift-mood XP bonus). */
export function buildShiftEmotionFrameHubLoggedPayload(): Record<string, unknown> {
  return { from_frame_hub: true };
}

/** Optional shift check-in on Frame — earns shift-mood Presence XP when mood is set. */
export function buildShiftEmotionMoodLoggedPayload(
  mood: MoodValue,
  shiftIntensity?: number | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { mood };
  if (shiftIntensity != null && shiftIntensity >= 1 && shiftIntensity <= 5) {
    payload.shift_intensity = shiftIntensity;
  }
  return payload;
}

/** Stable dedupe key for `lastShiftLogKeyRef` — mirrors `JSON.stringify(payload)`. */
export function shiftEmotionFrameHubLogDedupeKey(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

/** RPC payload + dedupe key for Frame hub “I'm done” → `shift_emotion_logged`. */
export function buildShiftEmotionFrameHubLogBundle(input?: {
  shiftMood?: MoodValue | null;
  shiftIntensity?: number | null;
}): {
  payload: Record<string, unknown>;
  logKey: string;
} {
  const payload =
    input?.shiftMood != null
      ? buildShiftEmotionMoodLoggedPayload(input.shiftMood, input.shiftIntensity ?? null)
      : buildShiftEmotionFrameHubLoggedPayload();
  return { payload, logKey: shiftEmotionFrameHubLogDedupeKey(payload) };
}
