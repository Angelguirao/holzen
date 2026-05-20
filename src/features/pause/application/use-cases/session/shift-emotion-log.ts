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

type LogShiftEmotionStepPort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<void>;

/** Frame hub “I'm done”: deduped `shift_emotion_logged` then advance to second breath. */
export async function runShiftEmotionFrameHubDone(
  input: { pauseInstanceId: string | null; lastShiftLogKey: string | null },
  ports: { logStep: LogShiftEmotionStepPort },
): Promise<RunShiftEmotionFrameHubDoneResult> {
  const { payload, logKey } = buildShiftEmotionFrameHubLogBundle();

  if (!input.pauseInstanceId) {
    return { status: 'advance', logKey };
  }

  if (input.lastShiftLogKey === logKey) {
    return { status: 'advance', logKey };
  }

  try {
    await ports.logStep({ instanceId: input.pauseInstanceId, payload });
    return { status: 'advance', logKey };
  } catch {
    return { status: 'sync_failed' };
  }
}
