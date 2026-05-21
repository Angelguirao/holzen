import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import type { PauseBreathSecondLabelVariant } from '@/features/pause/public-session';
import type { BriefPauseStep } from '@/features/pause/domain/ritual-types';
import type { PauseSessionStepHandlersProvidersSlice } from '../reflect/flows/pause-session-step-handler-types';

/** Provider fields for scaffold VM (subset of `usePauseSessionProviders`). */
export type PauseSessionScaffoldVmProvidersSlice = PauseSessionStepHandlersProvidersSlice & {
  t: TFunction;
  mantra: string;
  btcData: BtcPriceData | null;
  trackedAssetId: string;
  prefersReducedMotion: boolean | null;
  breathSecondLabelVariant: PauseBreathSecondLabelVariant;
};

export type PauseSessionScaffoldVmChromeSlots = {
  briefStepperSlot: ReactNode;
  engagedOpenMaxCountdownSlot: ReactNode;
};

/** Route-owned React for scaffold header slots — injected from `screens/pause/components/`. */
export type PauseScaffoldChromeRegistry = {
  renderBriefStepper: (briefStep: BriefPauseStep) => ReactNode;
  renderEngagedOpenMaxCountdown: (engagedAtIso: string) => ReactNode;
};
