import { usePauseSessionProviders } from './use-pause-session-providers-conductor';
import { usePauseSessionFlow } from './use-pause-session-flow';
import type { PauseScaffoldChromeRegistry } from './session/pause-session-scaffold-vm-types';
import type { PauseSessionProviders } from './session/pause-session-providers-types';
import type { PauseSessionRitualSurfaceResult } from './use-pause-session-ritual-surface';

/** View-model for `PauseSessionScreen` — subscription shell + ritual surface props. */
export type PauseSessionScreenViewModel = PauseSessionRitualSurfaceResult &
  Pick<
    PauseSessionProviders,
    | 't'
    | 'subLoading'
    | 'canEngagePause'
    | 'entitlement'
    | 'checkoutLoading'
    | 'trialLoading'
    | 'startReactivationCheckout'
    | 'ensureTrial'
    | 'refreshSubscription'
    | 'profileLoaded'
    | 'handleBriefSaveToJourney'
  >;

/** `/pause` route conductor — providers, flow (with route chrome registry), view-model. */
export function usePauseSessionScreen(chromeRegistry: PauseScaffoldChromeRegistry) {
  const providers = usePauseSessionProviders();
  const ritual = usePauseSessionFlow(providers, chromeRegistry);
  return usePauseSessionScreenViewModel(providers, ritual);
}

/**
 * Merges subscription gates from providers with ritual surface props for `/pause` UI.
 */
export function usePauseSessionScreenViewModel(
  providers: PauseSessionProviders,
  ritual: PauseSessionRitualSurfaceResult,
): PauseSessionScreenViewModel {
  const {
    t,
    subLoading,
    canEngagePause,
    entitlement,
    checkoutLoading,
    trialLoading,
    startReactivationCheckout,
    ensureTrial,
    refreshSubscription,
    profileLoaded,
    handleBriefSaveToJourney,
  } = providers;

  return {
    t,
    subLoading,
    canEngagePause,
    entitlement,
    checkoutLoading,
    trialLoading,
    startReactivationCheckout,
    ensureTrial,
    refreshSubscription,
    profileLoaded,
    handleBriefSaveToJourney,
    ...ritual,
  };
}
