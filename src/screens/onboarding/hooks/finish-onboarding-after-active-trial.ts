import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { trackOnboardingCompleted } from '@/features/pause/public-home';
import { trackTrialStarted } from '@/features/subscription/public';

type Args = {
  completeOnboarding: () => Promise<void>;
  trackedAssetId: string;
  threshold: number;
  t: TFunction;
  /** Called after profile + analytics + toast — typically `navigate('/', { replace: true })`. */
  goHome?: () => void;
};

/** Marks onboarding complete when trial entitlement already exists (Checkout skip or return). */
export async function finishOnboardingAfterActiveTrial({
  completeOnboarding,
  trackedAssetId,
  threshold,
  t,
  goHome,
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
  goHome?.();
}
