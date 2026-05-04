/** RPC payload + dedupe key for Frame hub “I'm done” → `shift_emotion_logged`. */
export function buildShiftEmotionFrameHubLogBundle(): {
  payload: Record<string, unknown>;
  logKey: string;
} {
  const payload: Record<string, unknown> = { from_frame_hub: true };
  return { payload, logKey: JSON.stringify(payload) };
}
