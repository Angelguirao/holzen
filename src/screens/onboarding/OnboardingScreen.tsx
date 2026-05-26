import { useProfile } from '@/features/user/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';

const OnboardingScreen = () => {
  const {
    threshold,
    trackedAssetId,
    saveOnboardingDraft,
    completeOnboarding,
  } = useProfile();
  const { ensureTrial, trialLoading } = useSubscription();

  return (
    <OnboardingFlow
      initialTrackedAssetId={trackedAssetId}
      initialThreshold={threshold}
      onSaveDraft={saveOnboardingDraft}
      onStartTrial={ensureTrial}
      onComplete={completeOnboarding}
      trialLoading={trialLoading}
    />
  );
};

export default OnboardingScreen;
