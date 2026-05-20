import { useRef, type Dispatch, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import {
  resolveEffectiveReflectionMessage,
  resolveReflectGenerationSeverityAbsPct,
  shouldRunPauseReflectGeneration,
} from '@/features/pause/application/use-cases/ritual/reflect/pause-session-reflect-decide-flow';
import type { PauseImpactData } from '@/features/pause/application/use-cases/impact-data';
import {
  type MoodValue,
  type PauseStep,
  type RitualDepth,
} from '@/features/pause/public';
import { usePauseReflectGeneration } from './use-pause-reflect-generation';
import { usePauseSessionDecideHandler } from '../decide/use-pause-session-decide-handler';

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
  const reflectGenEnabled = shouldRunPauseReflectGeneration(ritualEntry, step);

  const {
    reflectionMessage: generatedReflectionMessage,
    loading: reflectionLoading,
    error: reflectionError,
    retry: retryReflection,
  } = usePauseReflectGeneration({
    pauseInstanceId,
    context,
    initialReflectionMessage: message,
    severityAbsPct: resolveReflectGenerationSeverityAbsPct(btcData?.changePercent),
    enabled: reflectGenEnabled,
  });

  const effectiveReflectionMessage = resolveEffectiveReflectionMessage(
    generatedReflectionMessage,
    message,
  );

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
