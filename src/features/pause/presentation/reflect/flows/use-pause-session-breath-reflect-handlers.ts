import { usePauseShiftFrameDoneHandler } from '../hub/use-pause-shift-frame-done-handler';
import { usePauseSessionBreathHandlers } from '../../session/use-pause-session-breath-handlers';
import { usePauseSessionReflectAndDecide } from './use-pause-session-reflect-and-decide';
import type {
  PauseSessionBreathReflectMoodSlice,
  PauseSessionBreathReflectProvidersSlice,
  PauseSessionBreathReflectRitualSlice,
  PauseSessionBreathReflectShellSlice,
} from '../../session/pause-session-step-handler-types';

/** Breath segment navigation, shift frame done, and reflect/decide for the pause session ritual. */
export function usePauseSessionBreathReflectHandlers(
  p: PauseSessionBreathReflectProvidersSlice,
  {
    shell,
    ritual,
  }: {
    shell: PauseSessionBreathReflectShellSlice;
    ritual: PauseSessionBreathReflectRitualSlice;
  },
  mood: PauseSessionBreathReflectMoodSlice,
) {
  const { t, dismissMessage, btcData, subscribed, subLoading, requirePro, refreshSubscription } = p;
  const { restored, message, context, pauseInstanceId, companions } = shell;
  const {
    step,
    phase,
    ritualEntry,
    briefStep,
    breathingFirstCompleted,
    breathingSecondCompleted,
    selectedMood,
    selectedMoodAfter,
    feelIntensity,
    shiftIntensity,
    setSwipeDirection,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setRitualEntry,
    setFrameDone,
    setMoodAfterDone,
    setDecision,
    setPauseImpactData,
    setPhase,
  } = ritual;

  const breath = usePauseSessionBreathHandlers({
    pauseInstanceId,
    restored,
    t,
    subLoading,
    subscribed,
    requirePro,
    phase,
    ritualEntry,
    briefStep,
    step,
    breathingFirstCompleted,
    breathingSecondCompleted,
    setSwipeDirection,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setRitualEntry,
    setFrameDone,
    setMoodAfterDone,
  });

  const { handleFrameImDone } = usePauseShiftFrameDoneHandler({
    pauseInstanceId,
    t,
    lastShiftLogKeyRef: mood.lastShiftLogKeyRef,
    setFrameDone,
    setMoodAfterDone,
    goToStep: breath.goToStep,
  });

  const reflect = usePauseSessionReflectAndDecide({
    t,
    ritualEntry,
    step,
    pauseInstanceId,
    context,
    message,
    btcData,
    companionsHaiku: companions.haiku ?? null,
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
  });

  return { breath, reflect, handleFrameImDone };
}
