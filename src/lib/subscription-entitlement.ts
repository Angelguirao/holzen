/** Client entitlement slice (§5.4) — maps Stripe/cache `subscription_status` to UX gates. */

export type Entitlement = 'pre_trial' | 'trialing' | 'active' | 'lapsed';

export function deriveEntitlement(args: {
  subscribed: boolean;
  subscriptionStatus: string | null;
}): Entitlement {
  if (args.subscribed) {
    return args.subscriptionStatus === 'trialing' ? 'trialing' : 'active';
  }
  if (args.subscriptionStatus === 'lapsed') return 'lapsed';
  return 'pre_trial';
}

export function canEngagePauseFromEntitlement(entitlement: Entitlement): boolean {
  return entitlement === 'trialing' || entitlement === 'active';
}
