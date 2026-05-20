import { usePauseSessionScaffoldPresentation } from './use-pause-session-scaffold-presentation';
import type {
  PauseSessionScaffoldVmChromeSlots,
  PauseSessionScaffoldVmProvidersSlice,
} from './session/pause-session-scaffold-vm-types';
import type { PauseSessionStepHandlersResult } from './session/use-pause-session-step-handlers';

/** Scaffold slots and ritual payloads for `PauseSessionScaffoldShell` (chrome slots injected from screens). */
export function usePauseSessionScaffoldVm(
  p: PauseSessionScaffoldVmProvidersSlice,
  step: PauseSessionStepHandlersResult,
  chrome: PauseSessionScaffoldVmChromeSlots,
) {
  const { mantra, btcData, trackedAssetId, prefersReducedMotion, breathSecondLabelVariant, t } = p;
  const { shell, ritual, mood, breath, reflect, toggleFavorite, handleFrameImDone, subscribed } =
    step;

  const scaffold = usePauseSessionScaffoldPresentation({
    t,
    btcData,
    trackedAssetId,
    ritualEntry: ritual.ritualEntry,
    phase: ritual.phase,
    hasCoalescedShellSession: shell.hasCoalescedShellSession,
    fetchedInstance: shell.fetchedInstance,
    swipeDirection: ritual.swipeDirection,
    prefersReducedMotion,
    briefStepperSlot: chrome.briefStepperSlot,
    engagedOpenMaxCountdownSlot: chrome.engagedOpenMaxCountdownSlot,
    briefStep: ritual.briefStep,
    step: ritual.step,
    moodDone: ritual.moodDone,
    selectedMood: ritual.selectedMood,
    selectedBriefFace: ritual.selectedBriefFace,
    feelIntensity: ritual.feelIntensity,
    onFeelTilesSelect: mood.onFeelTilesSelect,
    setBriefStep: ritual.setBriefStep,
    breathingRef: breath.breathingRef,
    mantra,
    severity: shell.severity,
    breathingFirstCompleted: ritual.breathingFirstCompleted,
    breathingSecondCompleted: ritual.breathingSecondCompleted,
    setBreathTimedActive: breath.trackBreathTimedActive,
    setBreathingFirstCompleted: ritual.setBreathingFirstCompleted,
    setBreathingSecondCompleted: ritual.setBreathingSecondCompleted,
    handleBriefBreathContinue: breath.handleBriefBreathContinue,
    handleBriefSkipBreath: breath.handleBriefSkipBreath,
    soundMuted: ritual.soundMuted,
    briefIntegrateDone: ritual.briefIntegrateDone,
    handleBriefIntegrateComplete: breath.handleBriefIntegrateComplete,
    handleBriefRepeatBreaths: breath.handleBriefRepeatBreaths,
    handleBriefSwitchToDeepPause: breath.handleBriefSwitchToDeepPause,
    handleDecide: reflect.handleDecide,
    goToStep: breath.goToStep,
    handleContinueAfterFirstBreath: breath.handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath: breath.handleContinueAfterSecondBreath,
    handleSkipFirstBreath: breath.handleSkipFirstBreath,
    handleSkipSecondBreath: breath.handleSkipSecondBreath,
    companions: shell.companions,
    companionPrefs: shell.companionPrefs,
    pauseInstanceId: shell.pauseInstanceId,
    context: shell.context,
    message: reflect.effectiveReflectionMessage,
    isFavorite: ritual.isFavorite,
    toggleFavorite,
    subscribed,
    handleFrameImDone,
    handleDeepFirstBreathRepeat: breath.handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat: breath.handleDeepSecondBreathRepeat,
    severityAbsPct: Math.abs(btcData?.changePercent ?? 0),
    reflectionLoading: reflect.reflectionLoading,
    reflectionError: reflect.reflectionError,
    onReflectionRetry: reflect.retryReflection,
  });

  return {
    sessionOnPicker: scaffold.sessionOnPicker,
    depthContextLine: scaffold.depthContextLine,
    depthPickerOnBrief: mood.depthPickerOnBrief,
    handleDepthPickerDeep: mood.handleDepthPickerDeep,
    scaffoldRitualDerived: scaffold.scaffoldRitualDerived,
    engagedOpenMaxCountdownSlot: scaffold.engagedOpenMaxCountdownSlot,
    handlePauseHeaderBack: breath.handlePauseHeaderBack,
    showPauseHeaderBack: breath.showPauseHeaderBack,
    briefStepperSlot: scaffold.briefStepperSlot,
    breathSecondLabelVariant,
    briefRitual: scaffold.briefRitual,
    deepRitual: scaffold.deepRitual,
  };
}

export type PauseSessionScaffoldVmResult = ReturnType<typeof usePauseSessionScaffoldVm>;
