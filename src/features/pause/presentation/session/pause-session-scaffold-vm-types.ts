import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/pause/public';
import type { PauseBreathSecondLabelVariant } from '@/features/pause/application/use-cases/ritual/breathe/breath-second-label-variant';
import type { PauseSessionStepHandlersProvidersSlice } from './pause-session-step-handler-types';

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

/** Route-owned React for scaffold header slots — injected from `screens/pause/lib/`. */
export type PauseScaffoldChromeRegistry = {
  renderBriefStepper: (briefStep: import('@/features/pause/public').BriefPauseStep) => ReactNode;
  renderEngagedOpenMaxCountdown: (engagedAtIso: string) => ReactNode;
};
