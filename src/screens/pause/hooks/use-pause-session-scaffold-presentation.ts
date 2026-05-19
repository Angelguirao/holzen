import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import {
  isPauseSessionDepthPickerActive,
  type FetchedPauseInstance,
  type PauseSessionScaffoldRitualPayloadsParams,
  type RitualDepth,
} from '@/features/pause/public';
import { usePauseSessionDepthAndBriefCopy } from '@/screens/pause/hooks/use-pause-session-depth-and-brief-copy';
import { usePauseSessionScaffoldChromeSlots } from '@/screens/pause/hooks/use-pause-session-scaffold-chrome-slots';
import { usePauseSessionScaffoldRitual } from '@/screens/pause/hooks/use-pause-session-scaffold-ritual';
import { usePauseSessionStepTransition } from '@/screens/pause/hooks/use-pause-session-step-transition';

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
};

/**
 * Depth-picker copy, step transitions, chrome slots, and brief/deep ritual scaffold props.
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

  const { briefStepperSlot, engagedOpenMaxCountdownSlot } = usePauseSessionScaffoldChromeSlots({
    phase,
    ritualEntry,
    briefStep: ritualPayloads.briefStep,
    fetchedInstance,
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
