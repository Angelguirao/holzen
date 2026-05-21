import { useRef } from 'react';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-session-reflect-and-decide-flow';
import { usePauseReflectGeneration } from '../generation/use-pause-reflect-generation';
import { usePauseSessionDecideHandler } from './use-pause-session-decide-handler';
import type { UsePauseSessionReflectAndDecideParams } from './pause-session-reflect-and-decide-types';

export type { UsePauseSessionReflectAndDecideParams } from './pause-session-reflect-and-decide-types';

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
  const { reflectGenEnabled, severityAbsPct } = resolvePauseSessionReflectAndDecidePreflight({
    ritualEntry,
    step,
    seedMessage: message,
    btcData,
  });

  const {
    reflectionMessage: generatedReflectionMessage,
    loading: reflectionLoading,
    error: reflectionError,
    retry: retryReflection,
  } = usePauseReflectGeneration({
    pauseInstanceId,
    context,
    initialReflectionMessage: message,
    severityAbsPct,
    enabled: reflectGenEnabled,
  });

  const { effectiveReflectionMessage } = resolvePauseSessionReflectAndDecideAfterGeneration({
    ritualEntry,
    step,
    seedMessage: message,
    generatedReflectionMessage,
    btcData,
  });

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
