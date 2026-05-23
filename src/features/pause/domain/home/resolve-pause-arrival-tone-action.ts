export type PauseArrivalToneAction = 'none' | 'clear-only' | 'play';

/** Whether Home should play the open-pause chime for this arrival (deduped per instance id). */
export function resolvePauseArrivalToneAction(
  newPauseArrival: boolean,
  pauseInstanceId: string | null,
  lastPlayedInstanceId: string | null,
): PauseArrivalToneAction {
  if (!newPauseArrival || !pauseInstanceId) return 'none';
  if (pauseInstanceId === lastPlayedInstanceId) return 'clear-only';
  return 'play';
}
