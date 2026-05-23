/** Minimal shape for local `/pause` resume checks (full `PersistedSession` lives in lib until storage migrates). */
export type PersistedSessionAnchor = {
  pauseInstanceId: string | null;
  message: string;
};

/** True when a pause ritual snapshot is worth writing or restoring (id and/or reflection copy). */
export function hasPersistablePauseSessionAnchor(
  pauseInstanceId: string | null | undefined,
  message: string | null | undefined,
): boolean {
  return Boolean(pauseInstanceId) || Boolean(message?.trim());
}

/** True when local `/pause` storage can resume a ritual (instance id and/or reflection copy). */
export function hasPersistedPauseSessionPayload(
  session: PersistedSessionAnchor | null | undefined,
): boolean {
  if (!session) return false;
  return hasPersistablePauseSessionAnchor(session.pauseInstanceId, session.message);
}
