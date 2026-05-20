export type RunPauseReflectMetadataLogResult =
  | { status: 'success' }
  | { status: 'sync_failed' };

type LogPauseStepPort = (params: {
  instanceId: string;
  stepType: 'note_updated' | 'tag_updated';
  payload: Record<string, unknown>;
}) => Promise<unknown>;

/** Reflect post-it note blur — `note_updated` step. */
export async function runPauseReflectNoteUpdate(
  input: { pauseInstanceId: string; text: string },
  ports: { logStep: LogPauseStepPort },
): Promise<RunPauseReflectMetadataLogResult> {
  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      stepType: 'note_updated',
      payload: { text: input.text },
    });
    return { status: 'success' };
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Reflect tags commit — `tag_updated` step. */
export async function runPauseReflectTagUpdate(
  input: { pauseInstanceId: string; tags: string[] },
  ports: { logStep: LogPauseStepPort },
): Promise<RunPauseReflectMetadataLogResult> {
  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      stepType: 'tag_updated',
      payload: { tags: input.tags },
    });
    return { status: 'success' };
  } catch {
    return { status: 'sync_failed' };
  }
}
