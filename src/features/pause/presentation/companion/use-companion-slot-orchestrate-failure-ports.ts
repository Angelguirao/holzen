import { useMemo } from 'react';
import { showLimitReachedToast } from '@/features/subscription/public-limits';
import type { ApplyCompanionSlotOrchestrateFailureUiPorts } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-failure-ui';

export type UseCompanionSlotOrchestrateFailurePortsParams = {
  fetchedSlotsRef: React.MutableRefObject<Set<string>>;
  requirePro: (feature: 'companions') => boolean;
  startCheckout: () => void;
  toast: (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => void;
};

/** Memoized paywall / toast adapters for companion slot orchestrate failures. */
export function useCompanionSlotOrchestrateFailurePorts({
  fetchedSlotsRef,
  requirePro,
  startCheckout,
  toast,
}: UseCompanionSlotOrchestrateFailurePortsParams): ApplyCompanionSlotOrchestrateFailureUiPorts {
  return useMemo(
    () => ({
      clearLazyFetchSlot: (slot) => fetchedSlotsRef.current.delete(slot),
      requirePro: () => requirePro('companions'),
      showLimitReached: () => showLimitReachedToast({ feature: 'companion', startCheckout }),
      showErrorToast: (title, description) =>
        toast({ title, description, variant: 'destructive' }),
    }),
    [fetchedSlotsRef, requirePro, startCheckout, toast],
  );
}
