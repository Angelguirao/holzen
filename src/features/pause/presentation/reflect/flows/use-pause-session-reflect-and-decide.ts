import { useMemo, useRef } from 'react';
import { buildCurrentFeelForReflect } from '@/features/pause/domain/reflect/generation/build-current-feel-for-reflect';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from './pause-reflect-flows-io';
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
  marketData,
  companionsHaiku,
  dismissMessage,
  refreshSubscription,
  setDecision,
  setPauseImpactData,
  setPhase,
  selectedMood,
  selectedBriefFace,
  selectedMoodAfter,
  breathingFirstCompleted,
  breathingSecondCompleted,
  feelIntensity,
  shiftIntensity,
  ritualStartedAtMs,
  companionPrefs,
  isFavorite,
}: UsePauseSessionReflectAndDecideParams) {
  const decidingRef = useRef(false);
  const { reflectGenEnabled, severityAbsPct } = resolvePauseSessionReflectAndDecidePreflight({
    ritualEntry,
    step,
    seedMessage: message,
    marketData,
  });

  const currentFeel = useMemo(
    () =>
      buildCurrentFeelForReflect({
        mood: selectedMood,
        intensity: feelIntensity,
        tile: selectedBriefFace,
        tileLabel:
          selectedBriefFace != null
            ? t(`pause.feelStep.tiles.${selectedBriefFace}`, { defaultValue: selectedBriefFace })
            : null,
      }),
    [selectedMood, feelIntensity, selectedBriefFace, t],
  );

  const {
    reflectionMessage: generatedReflectionMessage,
    reflectionContent: generatedReflectionContent,
    loading: reflectionLoading,
    error: reflectionError,
    retry: retryReflection,
  } = usePauseReflectGeneration({
    pauseInstanceId,
    context,
    initialReflectionMessage: message,
    severityAbsPct,
    currentFeel,
    enabled: reflectGenEnabled,
  });

  const { effectiveReflectionMessage } = resolvePauseSessionReflectAndDecideAfterGeneration({
    ritualEntry,
    step,
    seedMessage: message,
    generatedReflectionMessage,
    marketData,
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
    ritualStartedAtMs,
    companionPrefs,
    isFavorite,
  });

  return {
    effectiveReflectionMessage,
    reflectionContent: generatedReflectionContent,
    reflectionLoading,
    reflectionError,
    retryReflection,
    handleDecide,
  };
}
