/**
 * Subscription paywall presentation I/O — re-exports paywall/trial telemetry from application.
 * Presentation hooks import this module, not `application/paywall-telemetry` directly.
 */
export {
  paywallPlanFromBillingInterval,
  trackPaywallSubscribed,
  trackPaywallViewed,
  trackTrialExpired,
  trackTrialStarted,
} from '@/features/subscription/application/paywall-telemetry';

export type {
  PaywallSubscribedPlan,
  PaywallViewedSource,
  TrialStartedSource,
} from '@/features/subscription/application/paywall-telemetry';
