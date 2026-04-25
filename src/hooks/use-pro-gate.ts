import { useCallback } from 'react';
import { useSubscription } from './use-subscription';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ProFeature } from '@/lib/pricing';
import { trackEvent } from '@/lib/posthog';

/**
 * Hook for gating Pro-only features.
 * Returns `isPro` and a `requirePro` guard that shows an upgrade toast.
 */
export function useProGate() {
  const { subscribed, loading, startCheckout, checkoutLoading } = useSubscription();
  const { t } = useTranslation();

  /** Returns true if the user has Pro access */
  const isPro = subscribed;

  /**
   * Call before executing a Pro-only action.
   * Returns `true` if allowed, `false` if blocked (shows contextual upgrade toast).
   */
  const requirePro = useCallback(
    (feature?: ProFeature | string): boolean => {
      if (subscribed) return true;
      try {
        trackEvent('paywall.viewed', { source: 'feature-gate' });
      } catch {
        /* no-op */
      }
      const descKey = feature ? `pro.desc_${feature}` : '';
      const description = feature && t(descKey) !== descKey
        ? t(descKey)
        : t('pro.upgradeDesc');
      toast(t('pro.featureLocked'), {
        description,
        action: {
          label: t('pro.upgradeCta'),
          onClick: () => {
            startCheckout();
          },
        },
        duration: 6000,
      });
      return false;
    },
    [subscribed, startCheckout, t],
  );

  return { isPro, isPending: loading, requirePro, startCheckout, checkoutLoading };
}