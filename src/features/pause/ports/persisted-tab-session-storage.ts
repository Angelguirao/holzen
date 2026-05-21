import type { PersistedSession } from '@/features/pause/domain/session-model';

/** Tab-local pause ritual snapshot storage (localStorage). */
export type PersistedTabSessionStoragePort = {
  load: () => PersistedSession | null;
  save: (data: PersistedSession) => void;
  clear: () => void;
};
