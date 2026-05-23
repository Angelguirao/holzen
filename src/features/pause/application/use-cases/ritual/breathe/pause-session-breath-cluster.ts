/**
 * CI cluster marker for `application/use-cases/ritual/breathe/` session breath RPC + phase advance (§3 / check:architecture-alignment).
 * Umbrella `pause-session-breath-flow` re-exports restored breath state, phase advance, segment log, and navigation constants.
 * Presentation: `pause-session-breath-io` imports sibling leaf modules directly (not this umbrella).
 */
export {};
