/**
 * CI cluster marker for `application/use-cases/ritual/reflect/mood/` (§3 / check:architecture-alignment).
 * Umbrella `pause-reflect-mood-flow` composes domain mood helpers + `run-initial-emotion-log` (not subcluster flow anchors).
 * Presentation: `pause-reflect-mood-io` imports `domain/reflect/mood/*` + `run-initial-emotion-log` directly (not this anchor).
 */
export {};
