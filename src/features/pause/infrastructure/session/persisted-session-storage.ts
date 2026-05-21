import { migratePersistedPauseSession } from '@/features/pause/application/use-cases/session/migrate-persisted-session';
import { PAUSE_RITUAL_SCHEMA_VERSION } from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';

const SESSION_KEY = 'holzen_pause_session';

export function saveSession(data: PersistedSession) {
  try {
    const normalized: PersistedSession = {
      ...data,
      pauseRitualSchema: PAUSE_RITUAL_SCHEMA_VERSION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    return migratePersistedPauseSession(parsed);
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
