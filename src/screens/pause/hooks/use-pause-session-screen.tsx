/**
 * `/pause` route orchestration — wires shell, ritual state, step handlers, and scaffold props.
 * Screen map: docs/screens/pause.md · Product model: docs/systems/pause-system.md
 */
import { usePauseSessionFlow } from '@/screens/pause/hooks/use-pause-session-flow';
import { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';

export function usePauseSessionScreen() {
  const providers = usePauseSessionProviders();
  const flow = usePauseSessionFlow(providers);

  return {
    t: providers.t,
    subLoading: providers.subLoading,
    canEngagePause: providers.canEngagePause,
    entitlement: providers.entitlement,
    checkoutLoading: providers.checkoutLoading,
    trialLoading: providers.trialLoading,
    startReactivationCheckout: providers.startReactivationCheckout,
    ensureTrial: providers.ensureTrial,
    refreshSubscription: providers.refreshSubscription,
    profileLoaded: providers.profileLoaded,
    handleBriefSaveToJourney: providers.handleBriefSaveToJourney,
    ...flow,
  };
}
