/**
 * CI cluster marker for `application/use-cases/ritual/reflect/share/` (§3 / check:architecture-alignment).
 * Umbrella `pause-reflect-share-flow` composes domain share builders + `run-reflection-share-image` +
 * session UI telemetry (not share subcluster flow anchors; orchestration anchor in
 * `pause-reflect-share-orchestration-flow`).
 * Presentation: `pause-reflect-share-io` imports share leaves directly; `presentation/reflect/telemetry/pause-reflect-telemetry-io` imports session UI telemetry directly.
 */
export {};
