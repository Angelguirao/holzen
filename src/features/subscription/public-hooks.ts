/**
 * Subscription React hooks — import from here in screens, app, components, and tests.
 * Domain types and rules remain on `@/features/subscription/public`.
 */
export {
  useSubscription,
  POST_CHECKOUT_SUBSCRIBE_FLAG,
  type SubscriptionBillingInterval,
  type Entitlement,
} from './presentation/use-subscription';
export { useProGate } from './presentation/use-pro-gate';
