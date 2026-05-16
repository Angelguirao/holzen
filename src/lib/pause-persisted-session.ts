import type { PersistedSession } from '@/lib/pause-session-storage';

/** True when a pause ritual snapshot is worth writing or restoring (id and/or reflection copy). */
export function hasPersistablePauseSessionAnchor(
  pauseInstanceId: string | null | undefined,
  message: string | null | undefined,
): boolean {
  return Boolean(pauseInstanceId) || Boolean(message?.trim());
}

/** True when local `/pause` storage can resume a ritual (instance id and/or reflection copy). */
export function hasPersistedPauseSessionPayload(session: PersistedSession | null | undefined): boolean {
  if (!session) return false;
  return hasPersistablePauseSessionAnchor(session.pauseInstanceId, session.message);
}
