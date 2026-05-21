/**
 * CI cluster anchor for ritual decide outcome flow (§3 / application imports).
 * Pure flow mapping lives in domain; re-export for application-layer imports.
 */
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  type PauseDecideOutcomeFlow,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';
