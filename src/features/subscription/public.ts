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
  getCheckoutSuppressionWindowMinutes,
  getCheckoutSuppressionWindowMs,
} from './application/checkout-suppression-window';
