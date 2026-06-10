import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ONBOARDING_TRIAL_CHECKOUT_PENDING_KEY,
} from '@/features/subscription/application/trial-checkout-flow';
import {
  trackTrialDenied,
} from '@/features/subscription/application/paywall-telemetry';
import { fetchTrialCheckoutGrantStatus } from '@/features/subscription/application/trial-checkout-grant';
import { finishOnboardingAfterActiveTrial } from '@/screens/onboarding/hooks/finish-onboarding-after-active-trial';

type Args = {
  userId: string | null;
  profileLoaded: boolean;
  trackedAssetId: string;
  threshold: number;
  completeOnboarding: () => Promise<void>;
  refreshSubscription: () => Promise<unknown>;
};

/** Finishes onboarding after Stripe trial Checkout returns to `/onboarding?trial_checkout=success`. */
export function useOnboardingTrialCheckoutReturn({
  userId,
  profileLoaded,
  trackedAssetId,
  threshold,
  completeOnboarding,
  refreshSubscription,
}: Args) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!userId || !profileLoaded || handledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const result = params.get('trial_checkout');
    if (!result) return;

    const pending = sessionStorage.getItem(ONBOARDING_TRIAL_CHECKOUT_PENDING_KEY);
    if (!pending) return;

    handledRef.current = true;
    sessionStorage.removeItem(ONBOARDING_TRIAL_CHECKOUT_PENDING_KEY);

    const url = new URL(window.location.href);
    url.searchParams.delete('trial_checkout');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    if (result === 'cancelled') {
      toast.info(
        t('home.subscription.trialCheckoutCancelled', {
          defaultValue: 'Trial setup was cancelled. You can try again when ready.',
        }),
      );
      return;
    }

    if (result !== 'success') return;

    void (async () => {
      try {
        await refreshSubscription();
        const granted = userId ? await fetchTrialCheckoutGrantStatus(userId) : false;
        if (!granted) {
          trackTrialDenied('trial_card_not_accepted');
          toast.error(
            t('home.subscription.trialCardNotAccepted', {
              defaultValue:
                'We could not start your trial with this card. Free trials require a standard debit or credit card — prepaid and virtual cards are not supported.',
            }),
          );
          return;
        }
        await finishOnboardingAfterActiveTrial({
          completeOnboarding,
          trackedAssetId,
          threshold,
          t,
        });
        navigate('/', { replace: true });
      } catch {
        toast.error(
          t('home.subscription.trialFailed', { defaultValue: 'Could not start trial. Try again.' }),
        );
      }
    })();
  }, [
    completeOnboarding,
    navigate,
    profileLoaded,
    refreshSubscription,
    t,
    threshold,
    trackedAssetId,
    userId,
  ]);
}
