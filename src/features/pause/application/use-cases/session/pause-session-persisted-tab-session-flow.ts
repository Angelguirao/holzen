/**
 * CI cluster anchor for tab-local pause ritual snapshot use cases (§3 / check:architecture-alignment).
 * Re-exports load/save/clear helpers bound to `PersistedTabSessionStoragePort`.
 * Presentation: `pause-persisted-tab-session-io.ts` imports `persisted-tab-session` directly (this anchor is CI-only).
 * Parity pins: colocated `presentation/session/pause-session-persisted-tab-session-io-parity.test.ts` + `pause-persisted-tab-session-io.re-exports.test.ts`.
 * Sibling cluster: `pause-session-persisted-tab-session-flow.test.ts` ↔ `pause-session-terminal-entry-flow` (distinct session CI umbrellas).
 */
export {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './persisted-tab-session';
