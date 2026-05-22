/**
 * CI cluster anchor for companion reflect-strip UI step completion (§3).
 * Presentation: `pause-companion-orchestration-io.ts` imports persist + query-key modules directly (not this anchor).
 */
export { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
export type { CompanionUiCompletionStep } from './companion-ui-completion-types';
export { persistCompanionUiStepCompletion } from './persist-ui-step-completion';
