import { usePauseShiftFrameDoneHandler } from '@/features/pause/public-hooks';
import { usePauseSessionBreathHandlers } from '@/features/pause/public-hooks';
import { usePauseSessionReflectAndDecide } from '@/features/pause/public-hooks';
import type { usePauseSessionMoodAndPersist } from '@/features/pause/public-hooks';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';
import type { usePauseSessionShellRitual } from '@/screens/pause/hooks/use-pause-session-shell-ritual';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;
type PauseSessionShellRitual = ReturnType<typeof usePauseSessionShellRitual>;
type PauseSessionMood = ReturnType<typeof usePauseSessionMoodAndPersist>;

/** Breath segment navigation, shift frame done, and reflect/decide for the pause session ritual. */
export function usePauseSessionBreathReflectHandlers(
  p: Pick<
    PauseSessionProviders,
    't' | 'dismissMessage' | 'btcData' | 'subscribed' | 'subLoading' | 'requirePro' | 'refreshSubscription'
  >,
  { shell, ritual }: PauseSessionShellRitual,
  mood: Pick<PauseSessionMood, 'lastShiftLogKeyRef'>,
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
