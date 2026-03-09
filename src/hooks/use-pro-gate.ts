import { useCallback } from 'react';
import { useSubscription } from './use-subscription';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ProFeature } from '@/lib/pricing';
at shows an upgrade toast.
 */
export function useProGate() {
  const { subscribed, startCheckout, checkoutLoading } = useSubscription();
  const { t } = useTranslation();

  /** Returns true if the user has Pro access */
  const isPro = subscribed;

  /**
   * Call before executing a Pro-only action.
   * Returns `true` if allowed, `false` if blocked (shows upgrade toast).
   */
  const requirePro = useCallback(
    (_feature?: ProFeature): boolean => {
      if (subscribed) return true;
      trackEvent('pro_feature_blocked', { feature:   description: t('pro.upgradeDesc'),
        ent('upgrade_click', { source: _feature });
            startCheckout();
          },
        },
        duration: 6000,
      });
 eckout, t],
  );

  return { isPro, requirePro, startCheckout, checkoutLoading };
}
