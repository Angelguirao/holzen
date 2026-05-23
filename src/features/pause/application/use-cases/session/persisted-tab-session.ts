import type { PersistedSession } from '@/features/pause/domain/session-model';
import type { PersistedTabSessionStoragePort } from '@/features/pause/ports/persisted-tab-session-storage';

/** Application use case: read the tab-local pause ritual snapshot from storage. */
export function loadPersistedTabSession(
  storage: PersistedTabSessionStoragePort,
): PersistedSession | null {
  return storage.load();
}

/** Application use case: write the tab-local pause ritual snapshot to storage. */
export function savePersistedTabSession(
  storage: PersistedTabSessionStoragePort,
  data: PersistedSession,
): void {
  storage.save(data);
}

/** Application use case: clear the tab-local pause ritual snapshot. */
export function clearPersistedTabSession(storage: PersistedTabSessionStoragePort): void {
  storage.clear();
}
