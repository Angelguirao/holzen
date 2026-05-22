/**
 * CI cluster marker for `application/use-cases/session/` terminal-entry guards (§3 / check:architecture-alignment).
 * Umbrella `pause-session-terminal-entry-flow` re-exports `terminal-entry-guard`.
 * Presentation: `pause-session-terminal-entry-io` imports `terminal-entry-guard` directly (not this umbrella).
 */
export {};
