/**
 * Home + Zen subscription UX flags derived from `useSubscription` + pause loading state.
 * Pure helpers — safe to call on every render (including before profile/onboarding gates).
 */

import type { Entitlement } from '@/lib/subscription-entitlement';
import { canEngagePauseFromEntitlement } from '@/lib/subscription-entitlement';

export function getHomeSubscriptionReady(subLoading: boolean): boolean {
  return !subLoading;
}

export function getHomeHasAccess(entitlement: Entitlement): boolean {
  return canEngagePauseFromEntitlement(entitlement);
}

export function getHomeShowLimitUpsell(subscriptionReady: boolean, entitlement: Entitlement): boolean {
  return subscriptionReady && !canEngagePauseFromEntitlement(entitlement);
}

export function getHomeShowPauseScheduling(
  subscriptionReady: boolean,
  hasAccess: boolean,
  hasOpenPause: boolean,
  loading: boolean,
): boolean {
  return subscriptionReady && hasAccess && !hasOpenPause && !loading;
}

export function getHomeSubscriptionGate(args: {
  subLoading: boolean;
  entitlement: Entitlement;
  hasOpenPause: boolean;
  loading: boolean;
}) {
  const subscriptionReady = getHomeSubscriptionReady(args.subLoading);
  const hasAccess = getHomeHasAccess(args.entitlement);
  return {
    subscriptionReady,
    hasAccess,
    showLimitUpsell: getHomeShowLimitUpsell(subscriptionReady, args.entitlement),
    showPauseScheduling: getHomeShowPauseScheduling(
      subscriptionReady,
      hasAccess,
      args.hasOpenPause,
      args.loading,
    ),
  };
}
