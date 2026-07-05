import {
  fetchSubscriptionSnapshot,
  type SubscriptionSnapshot,
} from '@/features/subscription/public-queries';

/** True when Stripe trial Checkout was granted and profile cache reflects trialing. */
export function isTrialCheckoutGranted(snapshot: SubscriptionSnapshot): boolean {
  return snapshot.subscribed === true && snapshot.subscriptionStatus === 'trialing';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls check-subscription briefly — webhook may trail Checkout redirect by a few seconds. */
export async function fetchTrialCheckoutGrantStatus(userId: string): Promise<boolean> {
  const maxAttempts = 5;
  const delayMs = 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const snapshot = await fetchSubscriptionSnapshot(userId, { force: true });
    if (isTrialCheckoutGranted(snapshot)) return true;
    if (attempt < maxAttempts - 1) await sleep(delayMs);
  }
  return false;
}
