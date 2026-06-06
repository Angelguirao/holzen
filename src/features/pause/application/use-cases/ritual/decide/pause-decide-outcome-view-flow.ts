/**
 * CI cluster anchor for ritual decide — outcome flow mapping (§3).
 * Pure helpers live in domain; re-export for application-layer imports.
 */
export { resolvePauseDecideOutcomeFlow } from '@/features/pause/domain/decide/pause-decide-outcome-flow';
export type { PauseImpactData } from './impact-data';
