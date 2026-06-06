import { useProfile } from '@/features/user/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';

const OnboardingScreen = () => {
  const {
    motivations,
    threshold,
    trackedAssetId,
    setMotivations,
    saveOnboardingDraft,
    completeOnboarding,
  } = useProfile();
  const { ensureTrial, trialLoading } = useSubscription();

  return (
    <OnboardingFlow
      initialMotivations={motivations}
      initialTrackedAssetId={trackedAssetId}
      initialThreshold={threshold}
      onSaveMotivations={setMotivations}
      onSaveDraft={saveOnboardingDraft}
      onStartTrial={ensureTrial}
      onComplete={completeOnboarding}
      trialLoading={trialLoading}
    />
  );
};

export default OnboardingScreen;
