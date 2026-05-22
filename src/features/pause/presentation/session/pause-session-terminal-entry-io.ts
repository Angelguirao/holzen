/**
 * Presentation I/O for `/pause` terminal-entry redirect guards.
 * Imports `terminal-entry-guard` directly (parity with step-transition and ritual-done I/O peels;
 * not `pause-session-terminal-entry-flow` CI anchor).
 * Parity pins: `pause-session-terminal-entry-io-parity.test.ts` (extended leaf + tab-session sibling), `pause-session-terminal-entry-io.re-exports.test.ts`,
 * `pause-session-terminal-entry-io.test.ts` (presentation smoke + leaf identity + reciprocal inline pins vs shell/scaffold I/O),
 * `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` ↔ `pause-session-scaffold-io` (application
 * `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` under `application/.../session/`; reciprocal inline pins in
 * `pause-session-terminal-entry-io-parity.test.ts` ↔ `pause-session-scaffold-io-parity.test.ts`),
 * `pause-session-terminal-entry-shell-io-sibling-parity.test.ts` ↔ `pause-session-shell-io` (application + presentation);
 * reciprocal inline pins: `pause-session-terminal-entry-io-parity.test.ts` ↔ `pause-session-shell-io-parity.test.ts` (both colocated under `presentation/session/`).
 * sibling cluster vs `pause-session-persisted-tab-session-flow` in application flow tests.
 */
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
