/** Router state when returning Home after a completed deep pause ritual. */
export type HomePauseHelpFeedbackLocationState = {
  pauseHelpFeedback?: {
    pauseInstanceId: string;
  };
};

export function parseHomePauseHelpFeedbackLocationState(
  state: unknown,
): { pauseInstanceId: string } | null {
  if (!state || typeof state !== 'object') return null;
  const o = state as Record<string, unknown>;
  const block = o.pauseHelpFeedback;
  if (!block || typeof block !== 'object') return null;
  const pauseInstanceId = (block as Record<string, unknown>).pauseInstanceId;
  if (typeof pauseInstanceId !== 'string' || !pauseInstanceId.trim()) return null;
  return { pauseInstanceId: pauseInstanceId.trim() };
}
