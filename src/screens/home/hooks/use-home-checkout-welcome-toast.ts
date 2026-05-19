import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { toast } from 'sonner';

const WELCOME_TOAST_ID = 'home:pro-checkout-welcome';

/**
 * After Stripe subscription checkout, the app lands on `/?subscribed=true`.
 * Refresh subscription state once and show a deduped welcome toast (stable Sonner id).
 */
export function useHomeCheckoutWelcomeToast(
  subscribedParam: string | null,
  refresh: () => void | Promise<void>,
  t: TFunction,
): void {
  useEffect(() => {
    if (subscribedParam !== 'true') return;
    void refresh();
    toast.success(
      t('pro.welcomeToast', { defaultValue: '🎉 Welcome to Pro! All features are now unlocked.' }),
      { id: WELCOME_TOAST_ID },
    );
  }, [subscribedParam, refresh, t]);
}
