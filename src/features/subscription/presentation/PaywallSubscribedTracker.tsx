import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/public';
import {
  POST_CHECKOUT_SUBSCRIBE_FLAG,
  useSubscription,
} from '@/features/subscription/public-hooks';
import {
  paywallPlanFromBillingInterval,
  trackPaywallSubscribed,
} from '@/features/subscription/application/paywall-telemetry';

const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Fires `paywall.subscribed` once after a Stripe subscription checkout return
 * (`?subscribed=true`), when the subscription snapshot confirms the user is
 * subscribed. Works for any shell route; does not depend on the Home page.
 */
export function PaywallSubscribedTracker() {
  const { user } = useAuth();
  const { subscribed, loading, subscriptionBillingInterval } = useSubscription();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (loading) return;

    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(POST_CHECKOUT_SUBSCRIBE_FLAG);
    } catch {
      return;
    }
    if (raw == null) return;

    const ts = Number.parseInt(raw, 10);
    if (!Number.isFinite(ts) || Date.now() - ts > MAX_AGE_MS) {
      try {
        sessionStorage.removeItem(POST_CHECKOUT_SUBSCRIBE_FLAG);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!subscribed) return;

    if (firedRef.current) return;
    firedRef.current = true;
    try {
      sessionStorage.removeItem(POST_CHECKOUT_SUBSCRIBE_FLAG);
    } catch {
      /* ignore */
    }
    trackPaywallSubscribed(paywallPlanFromBillingInterval(subscriptionBillingInterval));
  }, [user, loading, subscribed, subscriptionBillingInterval]);

  return null;
}
