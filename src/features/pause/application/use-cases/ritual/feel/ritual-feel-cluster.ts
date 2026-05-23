/**
 * CI cluster marker for `application/use-cases/ritual/feel/` (§3 / check:architecture-alignment).
 * Umbrella `pause-feel-flow` composes domain mood helpers + `run-initial-emotion-log` (not subcluster flow anchors).
 * Presentation: `pause-feel-io` imports `domain/feel/*` + `run-initial-emotion-log` directly (not this anchor).
 * Parity: `pause-feel-io-parity.test.ts` (application + presentation I/O ↔ umbrella + repository binding).
 */
export {};
