export function computeFavoriteToggleNext(isFavorite: boolean): boolean {
  return !isFavorite;
}

export function shouldShowFavoriteProHint(newValue: boolean, subscribed: boolean): boolean {
  return newValue && !subscribed;
}

export type RunPauseFavoriteToggleResult =
  | { status: 'no_instance' }
  | { status: 'success'; newValue: boolean }
  | { status: 'sync_failed'; attemptedValue: boolean };

type LogFavoriteTogglePort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<unknown>;

/** Reflect heart toggle — `favorite_toggled` step with optimistic UI handled by caller. */
export async function runPauseFavoriteToggle(
  input: { pauseInstanceId: string | null; isFavorite: boolean },
  ports: { logStep: LogFavoriteTogglePort },
): Promise<RunPauseFavoriteToggleResult> {
  if (!input.pauseInstanceId) {
    return { status: 'no_instance' };
  }

  const newValue = computeFavoriteToggleNext(input.isFavorite);
  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: { is_favorite: newValue },
    });
    return { status: 'success', newValue };
  } catch {
    return { status: 'sync_failed', attemptedValue: newValue };
  }
}
