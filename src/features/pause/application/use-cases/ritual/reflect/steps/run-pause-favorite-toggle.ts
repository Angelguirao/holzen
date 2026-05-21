export function computeFavoriteToggleNext(isFavorite: boolean): boolean {
  return !isFavorite;
}

export function shouldShowFavoriteProHint(newValue: boolean, subscribed: boolean): boolean {
  return newValue && !subscribed;
}

import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type RunPauseFavoriteToggleResult =
  | { status: 'no_instance' }
  | { status: 'success'; newValue: boolean }
  | { status: 'sync_failed'; attemptedValue: boolean };

/** Reflect heart toggle — `favorite_toggled` step with optimistic UI handled by caller. */
export async function runPauseFavoriteToggle(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; isFavorite: boolean },
): Promise<RunPauseFavoriteToggleResult> {
  if (!input.pauseInstanceId) {
    return { status: 'no_instance' };
  }

  const newValue = computeFavoriteToggleNext(input.isFavorite);
  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'favorite_toggled',
      payload: { is_favorite: newValue },
    });
    return { status: 'success', newValue };
  } catch {
    return { status: 'sync_failed', attemptedValue: newValue };
  }
}
