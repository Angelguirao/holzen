/**
 * CI cluster anchor for ritual reflect steps — favorite toggle (§3).
 * Mutation use case + domain pro-hint gate for presentation I/O.
 * Sibling pins: `pause-favorite-toggle-flow.test.ts` ↔ `pause-reflection-step-log-flow.test.ts` (inline);
 * `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts` ↔ `pause-reflection-step-log-flow`.
 */
export { runPauseFavoriteToggle } from './run-pause-favorite-toggle';
export { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
