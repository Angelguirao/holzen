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
