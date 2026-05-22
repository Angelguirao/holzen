/**
 * Presentation I/O for `/pause` terminal-entry redirect guards.
 * Imports `terminal-entry-guard` directly (parity with step-transition and ritual-done I/O peels;
 * not `pause-session-terminal-entry-flow` CI anchor).
 * Parity pins: `pause-session-terminal-entry-io-parity.test.ts`, `pause-session-terminal-entry-io.re-exports.test.ts`;
 * sibling cluster vs `pause-session-persisted-tab-session-flow` in application flow tests.
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
