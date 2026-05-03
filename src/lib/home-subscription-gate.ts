/**
 * Home + Zen subscription UX flags derived from `useSubscription` + pause loading state.
 * Pure helpers — safe to call on every render (including before profile/onboarding gates).
 */

export function getHomeSubscriptionReady(
  subLoading: boolean,
  subscribed: boolean,
  monthlyRemaining: number | undefined,
): boolean {
  return !subLoading && (subscribed || monthlyRemaining !== undefined);
}

export function getHomeHasAccess(subscribed: boolean, monthlyRemaining: number | undefined): boolean {
  return subscribed || ((monthlyRemaining ?? 0) > 0);
}

export function getHomeShowLimitUpsell(
  subscriptionReady: boolean,
  subscribed: boolean,
  monthlyRemaining: number | undefined,
): boolean {
  return subscriptionReady && !subscribed && monthlyRemaining === 0;
}

export function getHomeShowPauseScheduling(
  subscriptionReady: boolean,
  hasAccess: boolean,
  message: string | null,
  loading: boolean,
): boolean {
  return subscriptionReady && hasAccess && !message && !loading;
}

export function getHomeSubscriptionGate(args: {
  subLoading: boolean;
  subscribed: boolean;
  monthlyRemaining: number | undefined;
  message: string | null;
  loading: boolean;
}) {
  const subscriptionReady = getHomeSubscriptionReady(args.subLoading, args.subscribed, args.monthlyRemaining);
  const hasAccess = getHomeHasAccess(args.subscribed, args.monthlyRemaining);
  return {
    subscriptionReady,
    hasAccess,
    showLimitUpsell: getHomeShowLimitUpsell(subscriptionReady, args.subscribed, args.monthlyRemaining),
    showPauseScheduling: getHomeShowPauseScheduling(
      subscriptionReady,
      hasAccess,
      args.message,
      args.loading,
    ),
  };
}
