/**
 * Presentation I/O for `/pause` terminal-entry redirect guards.
 * `use-pause-session-terminal-entry-redirect` imports here instead of deep `application/use-cases/*`.
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';
