/**
 * CI cluster anchor for `/pause` terminal-entry guards (§3 / check:architecture-alignment).
 * Re-exports pure helpers that block deep links when the instance is terminal in Postgres.
 * Presentation: `pause-session-terminal-entry-io.ts` imports through this anchor.
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './terminal-entry-guard';
