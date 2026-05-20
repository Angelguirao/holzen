import type { Entitlement } from '@/features/subscription/public';
import type { PauseBreathSecondLabelVariant } from '@/features/pause/application/use-cases/ritual/breathe/breath-second-label-variant';
import type { PauseHolzenProvidersSlice } from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
import type { PauseSessionFlowCoreProvidersSlice } from '../use-pause-session-flow-core';
import type { PauseSessionScaffoldVmProvidersSlice } from './pause-session-scaffold-vm-types';
import type { PauseSessionShellRitualProvidersSlice } from './use-pause-session-shell-ritual';

export type { PauseSessionFlowCoreProvidersSlice } from '../use-pause-session-flow-core';
export type { PauseSessionScaffoldVmProvidersSlice } from './pause-session-scaffold-vm-types';

/** Holzen home context fields required by `/pause` providers (injected from `useHolzen` in screens). */
export type PauseSessionHolzenProvidersSlice = PauseHolzenProvidersSlice;

/** Subscription + pro-gate fields surfaced on the pause screen shell. */
export type PauseSessionSubscriptionGateSlice = {
  subscribed: boolean;
  subLoading: boolean;
  entitlement: Entitlement;
  canEngagePause: boolean;
  checkoutLoading: boolean;
  trialLoading: boolean;
  ensureTrial: () => void | Promise<void>;
  startReactivationCheckout: () => void | Promise<void>;
  refreshSubscription: () => void | Promise<void>;
  requirePro: (feature: 'deep_pause') => boolean;
};

/** Providers for flow + scaffold screen conductors (shell, steps, scaffold VM). */
export type PauseSessionFlowConductorProvidersSlice = PauseSessionShellRitualProvidersSlice &
  PauseSessionScaffoldVmProvidersSlice;

/** Full provider bag returned by `usePauseSessionProviders` (screen hook). */
export type PauseSessionProviders = PauseSessionFlowConductorProvidersSlice &
  PauseSessionSubscriptionGateSlice & {
    handleBriefSaveToJourney: () => void;
    profileLoaded: boolean;
  };
