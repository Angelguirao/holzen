import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';
import { useOnboardingTrialCheckoutReturn } from '@/screens/onboarding/hooks/use-onboarding-trial-checkout-return';

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
  const { startTrialCheckout, trialLoading, manualRetry } = useSubscription();

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
      onStartTrial={() => startTrialCheckout({ fromOnboarding: true })}
      trialLoading={trialLoading}
    />
  );
};

export default OnboardingScreen;
