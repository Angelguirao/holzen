/**
 * CI cluster marker for `application/use-cases/ritual/reflect/generation/` (§3 / check:architecture-alignment).
 * Umbrella `pause-reflect-generation-flow` composes holzen-reflect + manual-open leaf use cases
 * (subcluster markers: `holzen-reflect/ritual-reflect-generation-holzen-reflect-cluster`,
 * `manual-open/ritual-reflect-generation-manual-open-cluster`; not subcluster flow anchors; PostHog on telemetry-flow modules).
 * Presentation: `pause-reflect-generation-io` and `pause-home-reflect-io` import leaf modules directly.
 */
export {};
