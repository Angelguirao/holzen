/**
 * CI cluster anchor for session step-handler bundle builders (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-step-handlers-cluster.ts` (empty export; unit-tested).
 * Re-exports pure shell/ritual bundle assembly used by `use-pause-session-step-handlers`.
 * Presentation: `pause-session-step-handlers-io.ts` imports `step-bundles` directly (not this umbrella).
 * Parity pins: `pause-session-step-handlers-io-parity.test.ts`, `pause-session-step-handlers-io.re-exports.test.ts`,
 * `pause-session-step-handlers-step-transition-flow-sibling-parity.test.ts` ↔ `pause-session-step-transition-flow`,
 * `pause-session-step-handlers-steps-flow-sibling-parity.test.ts` ↔ `ritual/reflect/steps/pause-reflect-steps-flow`.
 * Sibling pin: `pause-session-step-handlers-flow.test.ts` ↔ `pause-session-step-transition-flow.test.ts`.
 */
export {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './step-bundles';
