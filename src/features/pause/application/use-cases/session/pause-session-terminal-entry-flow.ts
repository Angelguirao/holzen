/**
 * CI cluster anchor for `/pause` terminal-entry guards (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-terminal-entry-cluster.ts` (empty export; unit-tested).
 * Re-exports pure helpers that block deep links when the instance is terminal in Postgres.
 * Presentation: `pause-session-terminal-entry-io.ts` imports `terminal-entry-guard` directly (not this umbrella).
 * Parity: `pause-session-terminal-entry-io-parity.test.ts` and `pause-session-terminal-entry-io.re-exports.test.ts` pin presentation ↔ this anchor.
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './terminal-entry-guard';
