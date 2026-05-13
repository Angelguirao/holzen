import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  POST_CHECKOUT_SUBSCRIBE_FLAG,
  useSubscription,
} from '@/hooks/use-subscription';
import type { SubscriptionBillingInterval } from '@/lib/subscription-snapshot-query';
import { trackEvent } from '@/lib/posthog';

const MAX_AGE_MS = 30 * 60 * 1000;

function paywallPlanFromInterval(interval: SubscriptionBillingInterval | null): 'monthly' | 'yearly' | 'unknown' {
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return 'unknown';
}

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
    try {
      trackEvent('paywall.subscribed', { plan: paywallPlanFromInterval(subscriptionBillingInterval) });
    } catch {
      /* no-op */
    }
  }, [user, loading, subscribed, subscriptionBillingInterval]);

  return null;
}
