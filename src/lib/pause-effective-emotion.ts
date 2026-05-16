/** Minimal pause row fields for post-ritual mood helpers (MVP — no v_pause_full). */

export type PauseEmotionFields = {
  post_pause_mood: string | null;
  shift_mood: string | null;
  post_pause_emotion_intensity: number | null;
  shift_emotion_intensity: number | null;
  has_post_pause_emotion_logged: boolean;
  has_shift_emotion_logged: boolean;
};

/**
 * Latest “after ritual” mood for analytics: completion-screen check-in
 * (`post_pause_emotion_logged`) overrides mid-ritual `shift_emotion_logged`.
 */
export function effectivePauseShiftMood(
  r: Pick<PauseEmotionFields, 'post_pause_mood' | 'shift_mood'>,
): string | null {
  const v = r.post_pause_mood ?? r.shift_mood;
  return v && v.length > 0 ? v : null;
}

export function effectivePauseShiftIntensity(
  r: Pick<PauseEmotionFields, 'post_pause_emotion_intensity' | 'shift_emotion_intensity'>,
): number | null {
  const a = r.post_pause_emotion_intensity;
  if (typeof a === 'number' && Number.isFinite(a)) return a;
  const b = r.shift_emotion_intensity;
  if (typeof b === 'number' && Number.isFinite(b)) return b;
  return null;
}

/** True when the user logged an explicit “after” mood (Frame shift or brief done check-in). */
export function hasPauseShiftOrPostEmotion(
  r: Pick<PauseEmotionFields, 'has_post_pause_emotion_logged' | 'has_shift_emotion_logged'>,
): boolean {
  return Boolean(r.has_post_pause_emotion_logged || r.has_shift_emotion_logged);
}
