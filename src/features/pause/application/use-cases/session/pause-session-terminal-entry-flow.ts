/**
 * CI cluster anchor for `/pause` terminal-entry guards (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-terminal-entry-cluster.ts` (empty export; unit-tested).
 * Re-exports pure helpers that block deep links when the instance is terminal in Postgres.
 * Presentation: `pause-session-terminal-entry-io.ts` imports `terminal-entry-guard` directly (not this umbrella).
 * Parity: `pause-session-terminal-entry-io-parity.test.ts` (leaf + presentation sibling vs tab-session I/O) and `pause-session-terminal-entry-io.re-exports.test.ts` pin presentation ↔ this anchor.
 * Sibling cluster: `pause-session-terminal-entry-flow.test.ts` ↔ `pause-session-persisted-tab-session-flow` (distinct session CI umbrellas);
 * `pause-session-terminal-entry-shell-flow-sibling-parity.test.ts` ↔ `pause-session-shell-flow`.
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './terminal-entry-guard';
