/**
 * CI cluster anchor for tab-local pause ritual snapshot use cases (§3 / check:architecture-alignment).
 * Re-exports load/save/clear helpers bound to `PersistedTabSessionStoragePort`.
 * Presentation: `pause-persisted-tab-session-io.ts` imports through this anchor.
 */
export {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './persisted-tab-session';
