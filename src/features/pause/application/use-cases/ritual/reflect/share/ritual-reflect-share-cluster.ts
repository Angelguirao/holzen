/**
 * CI cluster marker for `application/use-cases/ritual/reflect/share/` (§3 / check:architecture-alignment).
 * Umbrella `pause-reflect-share-flow` composes domain share builders + `run-reflection-share-image` +
 * session UI telemetry (not share subcluster flow anchors; orchestration anchor in
 * `pause-reflect-share-orchestration-flow`).
 * Presentation: `pause-reflect-share-io` and `pause-reflect-telemetry-io` import leaf modules directly.
 */
export {};
