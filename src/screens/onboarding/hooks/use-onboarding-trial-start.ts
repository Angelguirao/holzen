import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/features/subscription/public-hooks';
import { finishOnboardingAfterActiveTrial } from '@/screens/onboarding/hooks/finish-onboarding-after-active-trial';

type Args = {
  trackedAssetId: string;
  threshold: number;
  completeOnboarding: () => Promise<void>;
};

/** Trial start from onboarding step 4 + shared finish path when trial is already active. */
export function useOnboardingTrialStart({
  trackedAssetId,
  threshold,
  completeOnboarding,
}: Args) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { startTrialCheckout, trialLoading } = useSubscription();

  const goHome = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const finishAndGoHome = useCallback(async () => {
    await finishOnboardingAfterActiveTrial({
      completeOnboarding,
      trackedAssetId,
      threshold,
      t,
      goHome,
    });
  }, [completeOnboarding, goHome, t, threshold, trackedAssetId]);

  const handleStartTrial = useCallback(async () => {
    const outcome = await startTrialCheckout({ fromOnboarding: true });
    if (outcome === 'trial_already_active') {
      await finishAndGoHome();
    }
  }, [finishAndGoHome, startTrialCheckout]);

  return { handleStartTrial, trialLoading, finishAndGoHome };
}
