/**
 * Presentation I/O for `/pause` terminal-entry redirect guards.
 * Imports `terminal-entry-guard` directly (parity with step-transition and ritual-done I/O peels;
 * not `pause-session-terminal-entry-flow` CI anchor).
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
