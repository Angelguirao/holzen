/**
 * Presentation I/O for tab-local pause ritual snapshots.
 * Imports `persisted-tab-session` use cases directly (parity with providers-io → holzen-providers-slice).
 * Parity pins: colocated `pause-session-persisted-tab-session-io-parity.test.ts` (wrapper delegation),
 * `pause-persisted-tab-session-io.re-exports.test.ts` (flow CI anchor ↔ leaf parity);
 * sibling cluster vs `pause-session-terminal-entry-flow` in application flow tests.
 */
import type { PersistedSession } from '@/features/pause/domain/session-model';
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/persisted-tab-session';
import { persistedTabSessionStorage } from '@/features/pause/public-rpc';

/** Default port + use case: read tab-local pause ritual snapshot. */
export function loadPausePersistedTabSession(): PersistedSession | null {
  return loadPersistedTabSession(persistedTabSessionStorage);
}

/** Default port + use case: write tab-local pause ritual snapshot. */
export function savePausePersistedTabSession(data: PersistedSession): void {
  savePersistedTabSession(persistedTabSessionStorage, data);
}

/** Default port + use case: clear tab-local pause ritual snapshot. */
export function clearPausePersistedTabSession(): void {
  clearPersistedTabSession(persistedTabSessionStorage);
}
