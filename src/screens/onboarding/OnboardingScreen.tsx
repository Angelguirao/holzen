import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';
import { useOnboardingTrialCheckoutReturn } from '@/screens/onboarding/hooks/use-onboarding-trial-checkout-return';
import { useOnboardingTrialStart } from '@/screens/onboarding/hooks/use-onboarding-trial-start';

const OnboardingScreen = () => {
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
  const { manualRetry } = useSubscription();
  const { handleStartTrial, trialLoading, finishAndGoHome } = useOnboardingTrialStart({
    trackedAssetId,
    threshold,
    completeOnboarding,
  });

  useOnboardingTrialCheckoutReturn({
    userId: user?.id ?? null,
    profileLoaded,
    finishAndGoHome,
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
