/**
 * Presentation I/O for session step-handler bundle builders.
 * Imports `application/use-cases/session/step-bundles` directly (parity with step-transition and frame/breath I/O peels;
 * not `pause-session-step-handlers-flow` CI anchor).
 * Parity pins: `pause-session-step-handlers-io-parity.test.ts`, `pause-session-step-handlers-io.re-exports.test.ts`,
 * `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts` ↔ `pause-session-step-transition-io`,
 * `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts` ↔ `scaffold/pause-session-scaffold-io`;
 * `pause-session-step-handlers-steps-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io` (cross-surface);
 * reciprocal inline pins: `pause-session-step-handlers-io.test.ts` ↔ `pause-reflect-steps-io.test.ts` and
 * `pause-session-step-transition-io.test.ts` (extended motion-token pins).
 */
export {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/application/use-cases/session/step-bundles';
