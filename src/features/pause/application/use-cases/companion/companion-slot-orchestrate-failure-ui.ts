import type { CompanionOrchestrateInvokeFailure } from './orchestrate-invoke-error';
import type { CompanionSlotOrchestrateMode } from './run-companion-slot-orchestrate';

const REGENERATE_PAYWALL_DEFAULT =
  'This companion is outside your current plan allowance.';

export type CompanionSlotOrchestrateFailureUi =
  | { action: 'lazy_paywall_upgrade_required' }
  | { action: 'lazy_paywall_limit_reached' }
  | {
      action: 'toast';
      title: string;
      description: string;
    };

/**
 * Maps classified orchestrate failures to UI actions (paywall vs toast copy).
 * Screen hooks apply toasts / Pro gate — no React in this module.
 */
export function resolveCompanionSlotOrchestrateFailureUi(
  failure: CompanionOrchestrateInvokeFailure,
  mode: CompanionSlotOrchestrateMode,
): CompanionSlotOrchestrateFailureUi {
  if (failure.isPaywall) {
    if (mode === 'lazy_fetch') {
      if (failure.code === 'companions_upgrade_required') {
        return { action: 'lazy_paywall_upgrade_required' };
      }
      return { action: 'lazy_paywall_limit_reached' };
    }
    return {
      action: 'toast',
      title: 'Companion unavailable',
      description: failure.userMessage ?? REGENERATE_PAYWALL_DEFAULT,
    };
  }

  return {
    action: 'toast',
    title: mode === 'lazy_fetch' ? 'Companion unavailable' : 'Regenerate failed',
    description: failure.userMessage,
  };
}
