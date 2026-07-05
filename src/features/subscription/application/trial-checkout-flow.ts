/** Set before redirecting to Stripe trial Checkout from onboarding step 4. */
export const ONBOARDING_TRIAL_CHECKOUT_PENDING_KEY = 'holzen_onboarding_trial_checkout_pending';

export const TRIAL_CHECKOUT_STARTED_KEY = 'holzen_trial_checkout_started_at';

export type TrialCheckoutReturnTo = 'onboarding' | 'home';

/** Result of `startTrialCheckout` when the browser stays on the current page. */
export type TrialCheckoutOutcome =
  | 'trial_already_active'
  | 'trial_denied'
  | 'no_user';
