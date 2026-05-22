/**
 * CI cluster anchor for session step-handler bundle builders (§3 / check:architecture-alignment).
 * Re-exports pure shell/ritual bundle assembly used by `use-pause-session-step-handlers`.
 * Presentation: `pause-session-step-handlers-io.ts` imports through this anchor.
 */
export {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './step-bundles';
