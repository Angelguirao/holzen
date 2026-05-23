/**
 * CI cluster anchor for `/pause` terminal-entry guards (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-terminal-entry-cluster.ts` (empty export; unit-tested).
 * Re-exports pure helpers that block deep links when the instance is terminal in Postgres.
 * Presentation: `pause-session-terminal-entry-io.ts` imports `terminal-entry-guard` directly (not this umbrella).
 * Parity: `presentation/session/pause-session-terminal-entry-io-parity.test.ts` + colocated `pause-session-terminal-entry-io-parity.test.ts` (application mirror; leaf + tab-session / shell / scaffold sibling pins) and `pause-session-terminal-entry-io.re-exports.test.ts` pin presentation ↔ this anchor.
 * Sibling cluster: `pause-session-terminal-entry-flow.test.ts` ↔ `pause-session-persisted-tab-session-flow` (distinct session CI umbrellas);
 * `pause-session-terminal-entry-shell-flow-sibling-parity.test.ts` ↔ `pause-session-shell-flow`;
 * `presentation/session/pause-session-terminal-entry-shell-io-sibling-parity.test.ts` ↔ `pause-session-shell-io` (application + presentation);
 * `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` ↔ `pause-session-scaffold-io` (application + presentation).
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './terminal-entry-guard';
