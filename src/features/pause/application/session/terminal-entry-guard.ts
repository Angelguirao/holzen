import type { PauseState } from '@/features/pause/domain/pause-state';
import {
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from '@/features/pause/application/session/persisted-session-guards';

/** DB rows in a terminal lifecycle state (not `active`, `engaged`, or `pending`). */
export const TERMINAL_PAUSE_DB_STATES = new Set<PauseState>(['completed', 'dismissed', 'expired']);

export function isTerminalPauseDbState(state: string | null | undefined): state is PauseState {
  return state != null && TERMINAL_PAUSE_DB_STATES.has(state as PauseState);
}

/**
 * Local `/pause` storage is tied to this instance id — user may still be finishing the ritual
 * (including after DB `expired` / `window_elapsed`) until they leave the screen.
 */
export function persistedPauseSessionAllowsTerminalEntry(
  saved: PersistedSessionAnchor | null,
  pauseInstanceId: string | null,
): boolean {
  if (!pauseInstanceId || !hasPersistedPauseSessionPayload(saved)) return false;
  return saved!.pauseInstanceId === pauseInstanceId;
}
