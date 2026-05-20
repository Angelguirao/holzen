export const REFLECTION_STEP_LOGGED_STORAGE_PREFIX = 'holzen_reflect_step_logged:';

export function reflectionStepLoggedStorageKey(pauseInstanceId: string): string {
  return `${REFLECTION_STEP_LOGGED_STORAGE_PREFIX}${pauseInstanceId}`;
}

/** Gate before firing `reflection_step` (copy ready or error surfaced). */
export function shouldLogPauseReflectionStep(input: {
  pauseInstanceId: string | null;
  reflectionLoading: boolean;
  reflectionMessage: string;
  reflectionError: string | null;
}): boolean {
  if (!input.pauseInstanceId) return false;
  if (input.reflectionLoading) return false;
  if (!input.reflectionMessage.trim() && !input.reflectionError) return false;
  return true;
}

export type ReflectionStepLogStoragePort = {
  /** When false, skip logging (e.g. sessionStorage unavailable). */
  canRead: () => boolean;
  isLogged: (storageKey: string) => boolean;
  markLogged: (storageKey: string) => void;
};

export type RunPauseReflectionStepLogResult =
  | { status: 'logged' }
  | { status: 'already_logged' }
  | { status: 'storage_unavailable' }
  | { status: 'sync_failed' };

type LogReflectionStepPort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<unknown>;

/**
 * Once per pause instance per tab — `reflection_step` after reflect copy is ready or failed.
 * Non-fatal on RPC error (caller may retry on revisit).
 */
export async function runPauseReflectionStepLogOnce(
  input: { pauseInstanceId: string },
  ports: { storage: ReflectionStepLogStoragePort; logStep: LogReflectionStepPort },
): Promise<RunPauseReflectionStepLogResult> {
  if (!ports.storage.canRead()) {
    return { status: 'storage_unavailable' };
  }

  const storageKey = reflectionStepLoggedStorageKey(input.pauseInstanceId);
  if (ports.storage.isLogged(storageKey)) {
    return { status: 'already_logged' };
  }

  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: { surface: 'pause_reflect' },
    });
    ports.storage.markLogged(storageKey);
    return { status: 'logged' };
  } catch {
    return { status: 'sync_failed' };
  }
}
