/**
 * Home + Zen subscription UX flags derived from `useSubscription` + pause loading state.
 * Pure helpers — safe to call on every render (including before profile/onboarding gates).
 */

export function getHomeSubscriptionReady(subLoading: boolean): boolean {
  return !subLoading;
}

export function getHomeHasAccess(subscribed: boolean): boolean {
  return subscribed;
}

export function getHomeShowLimitUpsell(subscriptionReady: boolean, subscribed: boolean): boolean {
  return subscriptionReady && !subscribed;
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
  subscribed: boolean;
  hasOpenPause: boolean;
  loading: boolean;
}) {
  const subscriptionReady = getHomeSubscriptionReady(args.subLoading);
  const hasAccess = getHomeHasAccess(args.subscribed);
  return {
    subscriptionReady,
    hasAccess,
    showLimitUpsell: getHomeShowLimitUpsell(subscriptionReady, args.subscribed),
    showPauseScheduling: getHomeShowPauseScheduling(
      subscriptionReady,
      hasAccess,
      args.hasOpenPause,
      args.loading,
    ),
  };
}
