import type { PersistedTabSessionStoragePort } from '@/features/pause/ports/persisted-tab-session-storage';
import {
  clearSession,
  loadSession,
  saveSession,
} from '@/features/pause/infrastructure/session/persisted-session-storage';

export const persistedTabSessionStorage: PersistedTabSessionStoragePort = {
  load: loadSession,
  save: saveSession,
  clear: clearSession,
};
