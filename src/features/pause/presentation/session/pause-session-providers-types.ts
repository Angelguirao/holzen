import type { Entitlement } from '@/features/subscription/public';
import type { BtcPriceData } from '@/features/market/public';
import type {
  CompanionData,
  CompanionPrefs,
  PauseBreathSecondLabelVariant,
  PauseSessionShellHolzen,
} from '@/features/pause/public';
import type { PauseSessionFlowCoreProvidersSlice } from '../use-pause-session-flow-core';
import type { PauseSessionScaffoldVmProvidersSlice } from './pause-session-scaffold-vm-types';
import type { PauseSessionShellRitualProvidersSlice } from '../use-pause-session-shell-ritual';

export type { PauseSessionFlowCoreProvidersSlice } from '../use-pause-session-flow-core';
export type { PauseSessionScaffoldVmProvidersSlice } from './pause-session-scaffold-vm-types';

/** Holzen home context fields required by `/pause` providers (injected from `useHolzen` in screens). */
export type PauseSessionHolzenProvidersSlice = {
  mantra: string;
  dismissMessage: () => void | Promise<void>;
  message: string | null;
  context: string | null;
  companions: CompanionData;
  lastPauseInstanceId: string | null;
  companionPrefs: CompanionPrefs;
  severity: PauseSessionShellHolzen['severity'];
  profileLoaded: boolean;
  resyncOpenPauseFromDb: () => void | Promise<void>;
  btcData: BtcPriceData | null;
  trackedAssetId: string;
};

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
