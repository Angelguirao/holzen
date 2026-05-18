/** Public API for subscription — export only what other features may import. */
export {
  canEngagePauseFromEntitlement,
  deriveEntitlement,
  type Entitlement,
} from './domain/entitlement';
export {
  getHomeHasAccess,
  getHomeShowLimitUpsell,
  getHomeShowPauseScheduling,
  getHomeSubscriptionGate,
  getHomeSubscriptionReady,
} from './application/home-gate';
export {
  broadcastCheckoutConfirmed,
  CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_STORAGE_KEY,
  getCheckoutSuppressionWindowMinutes,
  getCheckoutSuppressionWindowMs,
  resetCheckoutSuppressionWindow,
  scheduleCheckoutGuardCleanup,
  setCheckoutSuppressionWindowMinutes,
  subscribeToCheckoutConfirmations,
  sweepStaleCheckoutGuards,
} from './application/checkout-suppression-window';
export type {
  SubscriptionBillingInterval,
  SubscriptionSnapshot,
} from './domain/subscription-snapshot';
export type { CheckoutEvent } from './domain/checkout-event';
export {
  fetchCheckoutEvents,
  getCheckoutEventsQueryOptions,
} from './infrastructure/queries/checkout-events-query';
