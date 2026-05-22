/**
 * CI cluster anchor for tab-local pause ritual snapshot use cases (§3 / check:architecture-alignment).
 * Re-exports load/save/clear helpers bound to `PersistedTabSessionStoragePort`.
 * Presentation: `pause-persisted-tab-session-io.ts` imports `persisted-tab-session` directly (this anchor is CI-only).
 * Parity: `pause-session-persisted-tab-session-io-parity.test.ts`.
 */
export {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './persisted-tab-session';
