import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import { isPauseSessionDepthPickerActive, type FetchedPauseInstance } from '@/features/pause/public';
import type { RitualDepth } from '@/features/pause/public-hooks';
import type { PauseSessionScaffoldRitualPayloadsParams } from './session/scaffold-ritual-payloads';
import { usePauseSessionDepthAndBriefCopy } from './use-pause-session-depth-and-brief-copy';
import { usePauseSessionScaffoldRitual } from './use-pause-session-scaffold-ritual';
import { usePauseSessionStepTransition } from './use-pause-session-step-transition';

export type UsePauseSessionScaffoldPresentationParams = Omit<
  PauseSessionScaffoldRitualPayloadsParams,
  'prefersReducedMotion'
> & {
  t: TFunction;
  btcData: BtcPriceData | null;
  trackedAssetId: string;
  ritualEntry: RitualDepth | 'picker';
  phase: 'session' | 'done';
  hasCoalescedShellSession: boolean;
  fetchedInstance: FetchedPauseInstance | null;
  swipeDirection: 'forward' | 'back';
  /** Framer Motion preference — coerced to boolean for ritual body props. */
  prefersReducedMotion: boolean | null;
  /** Built via `PauseScaffoldChromeRegistry` from `screens/pause/lib/`; injected to avoid features → screens imports. */
  briefStepperSlot: ReactNode;
  engagedOpenMaxCountdownSlot: ReactNode;
};

/**
 * Depth-picker copy, step transitions, and brief/deep ritual scaffold props.
 * Chrome slots are supplied by `usePauseSessionScaffoldChromeSlots` + route registry.
 */
export function usePauseSessionScaffoldPresentation(params: UsePauseSessionScaffoldPresentationParams) {
  const {
    t,
    btcData,
    trackedAssetId,
    ritualEntry,
    phase,
    hasCoalescedShellSession,
    fetchedInstance,
    swipeDirection,
    prefersReducedMotion,
    briefStepperSlot,
    engagedOpenMaxCountdownSlot,
    ...ritualPayloads
  } = params;

  const { depthContextLine } = usePauseSessionDepthAndBriefCopy({
    t,
    btcData,
    trackedAssetId,
    ritualEntry,
  });

  const stepTransition = usePauseSessionStepTransition({
    swipeDirection,
    prefersReducedMotion,
  });

  const sessionOnPicker = isPauseSessionDepthPickerActive({
    phase,
    ritualEntry,
    hasShellMessage: hasCoalescedShellSession,
  });

  const { scaffoldRitualDerived, briefRitual, deepRitual } = usePauseSessionScaffoldRitual({
    derived: {
      ritualEntry,
      step: ritualPayloads.step,
      briefStep: ritualEntry === 'brief' ? ritualPayloads.briefStep : undefined,
      severity: ritualPayloads.severity,
      moodDone: ritualPayloads.moodDone,
      breathingFirstCompleted: ritualPayloads.breathingFirstCompleted,
      breathingSecondCompleted: ritualPayloads.breathingSecondCompleted,
      t,
    },
    payloads: {
      ...ritualPayloads,
      stepTransition,
      prefersReducedMotion: !!prefersReducedMotion,
    },
  });

  return {
    depthContextLine,
    sessionOnPicker,
    briefStepperSlot,
    engagedOpenMaxCountdownSlot,
    scaffoldRitualDerived,
    briefRitual,
    deepRitual,
  };
}
