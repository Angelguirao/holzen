/**
 * CI cluster marker for `application/use-cases/session/` shell chrome (§3 / check:architecture-alignment).
 * Umbrella `pause-session-shell-flow` re-exports hydration, header-back, mount-log, and shell VM siblings.
 * Presentation: `pause-session-shell-io` imports sibling modules directly (not this umbrella).
 */
export {};
