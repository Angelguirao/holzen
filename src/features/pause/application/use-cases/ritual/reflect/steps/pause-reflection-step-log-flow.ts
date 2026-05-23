/**
 * CI cluster anchor for ritual reflect steps — reflection_step log (§3).
 * Mutation use case + domain dedupe gate for presentation I/O.
 * Sibling pins: `pause-reflection-step-log-flow.test.ts` ↔ `pause-favorite-toggle-flow.test.ts` (inline);
 * `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts` ↔ `pause-favorite-toggle-flow`;
 * `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`
 * (reciprocal inline pins in `pause-reflection-step-log-flow.test.ts` ↔ `pause-reflect-steps-flow.test.ts`).
 */
export { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';
export { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
