/** Body for Frame hub `shift_emotion_logged` (`from_frame_hub: true`). */
export function buildShiftEmotionFrameHubLoggedPayload(): Record<string, unknown> {
  return { from_frame_hub: true };
}

/** Stable dedupe key for `lastShiftLogKeyRef` — mirrors `JSON.stringify(payload)`. */
export function shiftEmotionFrameHubLogDedupeKey(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

/** RPC payload + dedupe key for Frame hub “I'm done” → `shift_emotion_logged`. */
export function buildShiftEmotionFrameHubLogBundle(): {
  payload: Record<string, unknown>;
  logKey: string;
} {
  const payload = buildShiftEmotionFrameHubLoggedPayload();
  return { payload, logKey: shiftEmotionFrameHubLogDedupeKey(payload) };
}
