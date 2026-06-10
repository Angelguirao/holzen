import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { trackOnboardingCompleted } from '@/features/pause/public-home';
import { trackTrialStarted } from '@/features/subscription/application/paywall-telemetry';

type Args = {
  completeOnboarding: () => Promise<void>;
  trackedAssetId: string;
  threshold: number;
  t: TFunction;
};

/** Marks onboarding complete when trial entitlement already exists (Checkout skip or return). */
export async function finishOnboardingAfterActiveTrial({
  completeOnboarding,
  trackedAssetId,
  threshold,
  t,
}: Args): Promise<void> {
  await completeOnboarding();
  trackTrialStarted('trial_checkout');
  trackOnboardingCompleted({
    stepsCompleted: 4,
    trackedAssetId,
    thresholdUp: threshold,
    thresholdDown: threshold,
  });
  toast.success(
    t('home.subscription.trialStarted', {
      defaultValue: 'Your free trial is active.',
    }),
  );
}
