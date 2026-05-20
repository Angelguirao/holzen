import { useCallback } from 'react';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import {
  classifyCompanionAccessDenied,
  showLimitReachedToast,
} from '@/features/subscription/public-limits';

/**
 * Subscription gate for companion lazy-fetch / regenerate (Pro + quota UI).
 */
export function useCompanionAccess() {
  const { isPro, requirePro, startCheckout } = useProGate();
  const {
    companionRemaining,
    flexCreditsBalance,
    applyOptimisticDecrement,
    refresh: refreshSubscription,
  } = useSubscription();

  const canAccessCompanion = useCallback(() => {
    const denied = classifyCompanionAccessDenied({
      isPro,
      companionRemaining,
      flexCreditsBalance,
    });
    if (!denied) return true;
    if (denied === 'upgrade_required') {
      requirePro('companions');
    } else {
      showLimitReachedToast({ feature: 'companion', startCheckout });
    }
    return false;
  }, [isPro, requirePro, companionRemaining, flexCreditsBalance, startCheckout]);

  return {
    canAccessCompanion,
    applyOptimisticDecrement,
    refreshSubscription,
    requirePro,
    startCheckout,
  };
}
