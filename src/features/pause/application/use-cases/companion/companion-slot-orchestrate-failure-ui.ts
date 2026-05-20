import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import type { CompanionOrchestrateInvokeFailure } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-invoke-error';
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

export type ApplyCompanionSlotOrchestrateFailureUiPorts = {
  clearLazyFetchSlot: (slot: RegenerateCompanionSlot) => void;
  requirePro: () => void;
  showLimitReached: () => void;
  showErrorToast: (title: string, description: string) => void;
};

/** Applies resolved failure UI via injected screen/subscription adapters. */
export function applyCompanionSlotOrchestrateFailureUi(
  failureUi: CompanionSlotOrchestrateFailureUi,
  slot: RegenerateCompanionSlot,
  ports: ApplyCompanionSlotOrchestrateFailureUiPorts,
): void {
  if (failureUi.action === 'lazy_paywall_upgrade_required') {
    ports.clearLazyFetchSlot(slot);
    ports.requirePro();
    return;
  }
  if (failureUi.action === 'lazy_paywall_limit_reached') {
    ports.clearLazyFetchSlot(slot);
    ports.showLimitReached();
    return;
  }
  ports.showErrorToast(failureUi.title, failureUi.description);
}
