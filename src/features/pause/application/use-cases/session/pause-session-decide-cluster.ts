/**
 * CI cluster marker for `application/use-cases/session/` decide ritual hydration (§3 / check:architecture-alignment).
 * Umbrella `pause-session-decide-flow` re-exports `ritual/decide/restored-decide-ritual-state` + `PauseImpactData`.
 * Presentation: `pause-session-decide-io` imports leaf modules directly (not this umbrella).
 */
export {};
