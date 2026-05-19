import { useRef, type Dispatch, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import type { MoodValue } from '@/screens/pause/components/MoodCheck';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import {
  isPauseReflectGenerationEnabled,
  type PauseImpactData,
  type RitualDepth,
} from '@/features/pause/public';
import { usePauseReflectGeneration } from '@/screens/pause/hooks/use-pause-reflect-generation';
import { usePauseSessionDecideHandler } from '@/screens/pause/hooks/use-pause-session-decide-handler';

export interface UsePauseSessionReflectAndDecideParams {
  t: TFunction;
  ritualEntry: RitualDepth | 'picker';
  step: PauseStep;
  pauseInstanceId: string | null;
  context: string | null;
  message: string;
  btcData: BtcPriceData | null;
  companionsHaiku: string | null;
  dismissMessage: () => void | Promise<void>;
  refreshSubscription: () => void | Promise<void>;
  setDecision: Dispatch<SetStateAction<string | null>>;
  setPauseImpactData: Dispatch<SetStateAction<PauseImpactData | null>>;
  setPhase: Dispatch<SetStateAction<'session' | 'done'>>;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  feelIntensity: number | null;
  shiftIntensity: number | null;
}

/**
 * Deep ritual reflection (`holzen-reflect` edge) and Decide-step completion RPCs.
 */
export function usePauseSessionReflectAndDecide({
  t,
  ritualEntry,
  step,
  pauseInstanceId,
  context,
  message,
  btcData,
  companionsHaiku,
  dismissMessage,
  refreshSubscription,
  setDecision,
  setPauseImpactData,
  setPhase,
  selectedMood,
  selectedMoodAfter,
  breathingFirstCompleted,
  breathingSecondCompleted,
  feelIntensity,
  shiftIntensity,
}: UsePauseSessionReflectAndDecideParams) {
  const decidingRef = useRef(false);
  const reflectGenEnabled = isPauseReflectGenerationEnabled(ritualEntry, step);

  const {
    reflectionMessage: generatedReflectionMessage,
    loading: reflectionLoading,
    error: reflectionError,
    retry: retryReflection,
  } = usePauseReflectGeneration({
    pauseInstanceId,
    context,
    initialReflectionMessage: message,
    severityAbsPct: Math.abs(btcData?.changePercent ?? 0),
    enabled: reflectGenEnabled,
  });

  const effectiveReflectionMessage = generatedReflectionMessage.trim() || message;

  const { handleDecide } = usePauseSessionDecideHandler({
    decidingRef,
    pauseInstanceId,
    t,
    refreshSubscription,
    setDecision,
    dismissMessage,
    setPauseImpactData,
    setPhase,
    context,
    selectedMood,
    selectedMoodAfter,
    ritualEntry,
    breathingFirstCompleted,
    breathingSecondCompleted,
    feelIntensity,
    shiftIntensity,
    reflectionMessage: effectiveReflectionMessage,
    haiku: companionsHaiku,
  });

  return {
    effectiveReflectionMessage,
    reflectionLoading,
    reflectionError,
    retryReflection,
    handleDecide,
  };
}
