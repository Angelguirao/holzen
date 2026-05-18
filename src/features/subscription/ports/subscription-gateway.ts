/** Port for Stripe / subscription edge reads — implement in infrastructure when extracted from hooks. */
export interface SubscriptionGateway {
  refreshSnapshot(): Promise<void>;
}
