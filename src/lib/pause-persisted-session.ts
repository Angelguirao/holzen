import type { PersistedSession } from '@/lib/pause-session-storage';

/** True when local `/pause` storage can resume a ritual (instance id and/or reflection copy). */
export function hasPersistedPauseSessionPayload(session: PersistedSession | null | undefined): boolean {
  if (!session) return false;
  return Boolean(session.pauseInstanceId) || Boolean(session.message?.trim());
}
