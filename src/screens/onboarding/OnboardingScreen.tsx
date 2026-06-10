import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';
import { finishOnboardingAfterActiveTrial } from '@/screens/onboarding/hooks/finish-onboarding-after-active-trial';
import { useOnboardingTrialCheckoutReturn } from '@/screens/onboarding/hooks/use-onboarding-trial-checkout-return';

const OnboardingScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    motivations,
    threshold,
    trackedAssetId,
    profileLoaded,
    setMotivations,
    saveOnboardingDraft,
    completeOnboarding,
  } = useProfile();
  const { startTrialCheckout, trialLoading, manualRetry } = useSubscription();

  const handleStartTrial = useCallback(async () => {
    const outcome = await startTrialCheckout({ fromOnboarding: true });
    if (outcome === 'trial_already_active') {
      await finishOnboardingAfterActiveTrial({
        completeOnboarding,
        trackedAssetId,
        threshold,
        t,
      });
    }
  }, [completeOnboarding, startTrialCheckout, t, threshold, trackedAssetId]);

  useOnboardingTrialCheckoutReturn({
    userId: user?.id ?? null,
    profileLoaded,
    trackedAssetId,
    threshold,
    completeOnboarding,
    refreshSubscription: manualRetry,
  });

  return (
    <OnboardingFlow
      initialMotivations={motivations}
      initialTrackedAssetId={trackedAssetId}
      initialThreshold={threshold}
      onSaveMotivations={setMotivations}
      onSaveDraft={saveOnboardingDraft}
      onStartTrial={handleStartTrial}
      trialLoading={trialLoading}
    />
  );
};

export default OnboardingScreen;
