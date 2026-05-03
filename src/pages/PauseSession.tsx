import { useState, useRef, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { type MoodValue } from '@/components/MoodCheck';

import { type PauseStep, STEPS } from '@/components/pause/PauseProgress';
import { PauseSessionGate } from '@/components/pause/PauseSessionGate';
import { PauseSessionScaffoldShell } from '@/components/pause/PauseSessionScaffoldShell';
import { PauseSessionGateContent } from '@/components/pause/PauseSessionGateContent';
import { type PauseBreathingHandle } from '@/components/pause/PauseBreathing';
import { PauseSessionDepthPickerStack } from '@/components/pause/PauseSessionDepthPickerStack';
import { PauseBriefProgress } from '@/components/pause/PauseBriefProgress';
import { isPauseSessionHeaderBackVisible } from '@/lib/pause-session-header-back';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';
import {
  mapPersistedStep,
  initialRitualEntry,
  initialBriefPauseStepFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialSelectedBriefFaceFromRestored,
} from '@/lib/pause-session-step-map';
import { initialDecideOnBackStepFromPersisted } from '@/lib/pause-session-initial-decide-on-back-step';
import { parsePauseSessionLocationState } from '@/lib/router-location-state';
import { coalescePauseSessionShellViewModel } from '@/lib/pause-session-shell-view-model';
import {
  isPauseSessionDepthPickerActive,
  isPauseSessionWaitingForInstanceFetch,
} from '@/lib/pause-session-gate-flags';
import { usePauseSessionStepTransition } from '@/hooks/use-pause-session-step-transition';
import { usePauseBreathSegmentRpcLoggers } from '@/hooks/use-pause-breath-segment-rpc-loggers';
import { usePauseFeelShiftLogDedupeRefs } from '@/hooks/use-pause-feel-shift-log-dedupe-refs';
import { usePauseFavoriteToggle } from '@/hooks/use-pause-favorite-toggle';
import { usePauseSessionInitialMoodHandlers } from '@/hooks/use-pause-session-initial-mood-handlers';
import { usePauseShiftFrameDoneHandler } from '@/hooks/use-pause-shift-frame-done-handler';
import { usePauseSessionDecideHandler } from '@/hooks/use-pause-session-decide-handler';
import { usePauseSessionExitNavigation } from '@/hooks/use-pause-session-exit-navigation';
import { usePauseSessionBreathStepHandlers } from '@/hooks/use-pause-session-breath-step-handlers';
import { usePauseSessionHeaderBackHandler } from '@/hooks/use-pause-session-header-back-handler';
import { usePauseSessionPersistToStorage } from '@/hooks/use-pause-session-persist-to-storage';
import { usePauseSessionRitualStorageSync } from '@/hooks/use-pause-session-ritual-storage-sync';
import { usePauseSessionEntryPresentationEffects } from '@/hooks/use-pause-session-entry-presentation-effects';
import { usePauseSessionBreathTimedActiveReset } from '@/hooks/use-pause-session-breath-timed-active-reset';
import { usePauseSessionDepthAndBriefCopy } from '@/hooks/use-pause-session-depth-and-brief-copy';
import { usePauseSessionBreathSecondLabelVariant } from '@/hooks/use-pause-session-breath-second-label-variant';
import type { PauseImpactData } from '@/lib/pause-impact-data';
import { usePauseSessionShell } from '@/hooks/use-pause-session-shell';
import { usePauseSessionMountLog } from '@/hooks/use-pause-session-mount-log';
import { usePauseSessionBriefPastStep } from '@/hooks/use-pause-session-brief-past-step';
import { usePauseSessionGoBack } from '@/hooks/use-pause-session-go-back';
import { usePauseSessionGoToStep } from '@/hooks/use-pause-session-go-to-step';
import { buildPauseSessionScaffoldRitualDerived } from '@/lib/pause-session-scaffold-ritual-props';
import { buildPauseSessionScaffoldRitualPayloads } from '@/lib/pause-session-scaffold-ritual-payloads';
import { usePauseSessionPendingPauseOfferNavigation } from '@/hooks/use-pause-session-pending-pause-offer-navigation';
import { usePauseSessionDepthPickerHandlers } from '@/hooks/use-pause-session-depth-picker-handlers';
import { usePauseSessionDeepChooseBridgeHandler } from '@/hooks/use-pause-session-deep-choose-bridge-handler';
import { usePauseSessionBriefFeelSelect } from '@/hooks/use-pause-session-brief-feel-select';

/**
 * `/pause` route: wires shell hydration, local ritual state, `pause-api` step handlers, and pause UI
 * (`PauseSessionGate*`, `PauseSessionScaffold*`, `PauseSession*RitualBody` under `src/components/pause/`).
 *
 * **Product / data model:** brief vs deep flows, RPCs, and SQL-first ratios on `v_pause_full` /
 * `pause_step_events` — `docs/systems/pause-system.md`.
 * **Structure:** thin page + named hooks + `src/lib` — `docs/fundamentals/react-screen-orchestration.md`.
 */
export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleClose, handleReturn } = usePauseSessionExitNavigation(navigate);
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const breathSecondLabelVariant = usePauseSessionBreathSecondLabelVariant();
  const {
    mantra,
    dismissMessage,
    message: holzenMessage,
    context: holzenContext,
    companions: holzenCompanions,
    lastPauseInstanceId: holzenLastPauseInstanceId,
    companionPrefs: holzenCompanionPrefs,
    severity: holzenSeverity,
    profileLoaded,
    resyncOpenPauseFromDb,
    btcData,
    trackedAssetId,
  } = useHolzen();
  const { subscribed, refresh: refreshSubscription } = useSubscription();

  const { onAfterMutation: pendingOfferAfterMutation, navigateAfterAdopt: pendingOfferNavigateAfterAdopt } =
    usePauseSessionPendingPauseOfferNavigation({
      navigate,
      resyncOpenPauseFromDb,
    });

  const nav = parsePauseSessionLocationState(location.state);
  const {
    pauseInstanceId: navPauseInstanceId,
    reflectionMessage: navReflectionMessage,
    context: navContext,
    companions: navCompanions,
    companionPrefs: navCompanionPrefs,
    severity: navSeverity,
  } = nav;

  const { restored, hydration, fetchPauseInstanceId, fetchedInstance, fetchFailed, resolved } = usePauseSessionShell({
    locationKey: location.key,
    nav,
    holzen: {
      message: holzenMessage,
      context: holzenContext,
      lastPauseInstanceId: holzenLastPauseInstanceId,
      companions: holzenCompanions,
      companionPrefs: holzenCompanionPrefs,
      severity: holzenSeverity,
    },
  });

  usePauseSessionMountLog({
    pauseInstanceIdPrefix: (fetchPauseInstanceId ?? navPauseInstanceId)?.slice(0, 8) ?? null,
    hasNavMessage: navReflectionMessage.length > 0,
    restoredFromStorage: restored !== null,
    hydrationStatus: hydration.status,
    ritualEntryInitial: initialRitualEntry(restored),
    briefStepInitial: initialBriefPauseStepFromRestored(restored),
  });

  const { message, context, pauseInstanceId, companions, companionPrefs, severity } =
    coalescePauseSessionShellViewModel(resolved, holzenSeverity);

  const hasCoalescedShellMessage = message.length > 0;

  const waitingForFetch = isPauseSessionWaitingForInstanceFetch({
    hydrationStatus: hydration.status,
    fetchFailed,
    fetchedInstance,
  });

  const restoredStep = mapPersistedStep(restored?.step);
  const restoredIdx = restored ? STEPS.indexOf(restoredStep) : -1;

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [decideOnBackStep, setDecideOnBackStep] = useState<'choose' | 'breath2'>(() =>
    initialDecideOnBackStepFromPersisted(restored),
  );
  const [phase, setPhase] = useState<'session' | 'done'>(restored?.phase ?? 'session');
  const [decision, setDecision] = useState<string | null>(restored?.decision ?? null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toggleFavorite } = usePauseFavoriteToggle({
    pauseInstanceId,
    isFavorite,
    setIsFavorite,
    subscribed,
    t,
  });
  const [moodDone, setMoodDone] = useState(restored?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(restored?.moodAfterDone ?? false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(restored?.selectedMood ?? null);
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<MoodValue | null>(restored?.selectedMoodAfter ?? null);
  const [feelIntensity, setFeelIntensity] = useState<number | null>(restored?.feelIntensity ?? null);
  const [shiftIntensity, setShiftIntensity] = useState<number | null>(restored?.shiftIntensity ?? null);
  const [breathingFirstCompleted, setBreathingFirstCompleted] = useState(
    restored?.breathingFirstCompleted ?? restored?.breathingCompleted ?? false,
  );
  const [breathingSecondCompleted, setBreathingSecondCompleted] = useState(restored?.breathingSecondCompleted ?? false);
  const [frameDone, setFrameDone] = useState(restored?.frameDone ?? false);
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<PauseImpactData | null>(null);

  usePauseSessionEntryPresentationEffects({ step, setDecideOnBackStep, setCurtainLifted });

  const {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
  } = usePauseBreathSegmentRpcLoggers({
    pauseInstanceId,
    initialSegment1Logged: restoredIdx > STEPS.indexOf('breathe'),
    initialSegment2Logged: restoredIdx > STEPS.indexOf('breath2'),
    t,
  });
  const { lastFeelLogKeyRef, lastShiftLogKeyRef } = usePauseFeelShiftLogDedupeRefs(pauseInstanceId);

  const [ritualEntry, setRitualEntry] = useState<RitualDepth | 'picker'>(() => initialRitualEntry(restored));
  const [briefStep, setBriefStep] = useState<BriefPauseStep>(() => initialBriefPauseStepFromRestored(restored));
  const [briefIntegrateDone, setBriefIntegrateDone] = useState(() =>
    initialBriefIntegrateDoneFromRestored(restored),
  );
  const [selectedBriefFace, setSelectedBriefFace] = useState(() => initialSelectedBriefFaceFromRestored(restored));
  const [pickerAboutOpen, setPickerAboutOpen] = useState(false);

  const { onBrief: depthPickerOnBrief, onDeep: depthPickerOnDeep, onAboutPauses: depthPickerOnAboutPauses } =
    usePauseSessionDepthPickerHandlers({
      setRitualEntry,
      setBriefStep,
      setPickerAboutOpen,
    });

  const { handleMoodSelect, handleMoodSkip, handleMoodReset } = usePauseSessionInitialMoodHandlers({
    pauseInstanceId,
    t,
    lastFeelLogKeyRef,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
    setSelectedBriefFace,
  });

  const { onBriefFeelSelect } = usePauseSessionBriefFeelSelect({ handleMoodSelect });

  usePauseSessionRitualStorageSync({
    pauseInstanceId,
    setRitualEntry,
    setBriefStep,
    setBriefIntegrateDone,
    setSelectedBriefFace,
  });

  usePauseSessionPersistToStorage({
    message,
    context,
    pauseInstanceId,
    companions,
    companionPrefs,
    severity,
    moodDone,
    moodAfterDone,
    selectedMood,
    selectedMoodAfter,
    feelIntensity,
    shiftIntensity,
    phase,
    decision,
    step,
    breathingFirstCompleted,
    breathingSecondCompleted,
    frameDone,
    decideOnBackStep,
    ritualEntry,
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
  });

  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'back'>('forward');

  const { goToStep } = usePauseSessionGoToStep({
    step,
    setSwipeDirection,
    setStep,
  });

  const { handleDeepChooseBridgeContinue } = usePauseSessionDeepChooseBridgeHandler({
    setDecideOnBackStep,
    goToStep,
  });

  const { handleFrameImDone } = usePauseShiftFrameDoneHandler({
    pauseInstanceId,
    t,
    lastShiftLogKeyRef,
    setFrameDone,
    setMoodAfterDone,
    goToStep,
  });

  const { goBack } = usePauseSessionGoBack({
    ritualEntry,
    briefStep,
    step,
    setSwipeDirection,
    setBriefStep,
    setBriefIntegrateDone,
    setStep,
  });

  const breathingRef = useRef<PauseBreathingHandle>(null);
  const decidingRef = useRef(false);
  const [breathTimedActive, setBreathTimedActive] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  usePauseSessionBreathTimedActiveReset({ step, ritualEntry, briefStep, setBreathTimedActive });

  const { handlePauseHeaderBack } = usePauseSessionHeaderBackHandler({
    breathingRef,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
    goBack,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
  });

  const showPauseHeaderBack = isPauseSessionHeaderBackVisible({
    phase,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
  });

  const {
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
  } = usePauseSessionBreathStepHandlers({
    goToStep,
    ritualEntry,
    briefStep,
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setDecideOnBackStep,
    setBriefStep,
    setBriefIntegrateDone,
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
  });

  const { depthContextLine, briefMacroLine } = usePauseSessionDepthAndBriefCopy({
    t,
    btcData,
    trackedAssetId,
    ritualEntry,
    briefStep,
  });

  const { goToBriefPastStep } = usePauseSessionBriefPastStep({
    briefStep,
    setBriefStep,
    setBriefIntegrateDone,
    setSwipeDirection,
  });

  const stepTransition = usePauseSessionStepTransition({
    swipeDirection,
    prefersReducedMotion,
  });

  const sessionOnPicker = isPauseSessionDepthPickerActive({
    phase,
    ritualEntry,
    hasShellMessage: hasCoalescedShellMessage,
  });

  const scaffoldRitualDerived = buildPauseSessionScaffoldRitualDerived({
    ritualEntry,
    step,
    briefStep,
    t,
  });

  const briefStepperSlot = useMemo(
    () =>
      ritualEntry === 'brief' ? (
        <PauseBriefProgress currentStep={briefStep} onStepClick={goToBriefPastStep} />
      ) : undefined,
    [ritualEntry, briefStep, goToBriefPastStep],
  );

  const briefDecideIntroKicker = t('pause.brief.decideKicker', { defaultValue: 'Step 4 · Decide' });

  const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads({
    briefStep,
    step,
    stepTransition,
    moodDone,
    selectedMood,
    selectedBriefFace,
    feelIntensity,
    onBriefFeelSelect,
    setBriefStep,
    breathingRef,
    mantra,
    severity,
    breathingFirstCompleted,
    breathingSecondCompleted,
    setBreathTimedActive,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    soundMuted,
    briefIntegrateDone,
    handleBriefIntegrateComplete,
    handleDecide,
    briefDecideIntroKicker,
    handleMoodSelect,
    handleMoodSkip,
    handleMoodReset,
    goToStep,
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    companions,
    companionPrefs,
    pauseInstanceId,
    context,
    message,
    isFavorite,
    toggleFavorite,
    subscribed,
    handleFrameImDone,
    handleDeepChooseBridgeContinue,
    decideOnBackStep,
  });

  return (
    <PauseSessionGate
      hasMessage={hasCoalescedShellMessage}
      phase={phase}
      waitingForFetch={waitingForFetch}
      fetchFailed={fetchFailed}
      hydrationStatus={hydration.status}
      profileLoaded={profileLoaded}
      onReturn={handleReturn}
    >
      <PauseSessionGateContent
        onPendingAfterMutation={pendingOfferAfterMutation}
        onPendingNavigateAfterAdopt={pendingOfferNavigateAfterAdopt}
        sessionOnPicker={sessionOnPicker}
        depthPickerSlot={
          <PauseSessionDepthPickerStack
            contextLine={depthContextLine}
            onBrief={depthPickerOnBrief}
            onDeep={depthPickerOnDeep}
            onAboutPauses={depthPickerOnAboutPauses}
            onClose={handleClose}
            aboutSheetOpen={pickerAboutOpen}
            onAboutSheetOpenChange={setPickerAboutOpen}
            aboutSheetTitle={t('pause.aboutPauses.sheetTitle')}
          />
        }
        scaffoldSlot={
          <PauseSessionScaffoldShell
            {...scaffoldRitualDerived}
            curtainLifted={curtainLifted}
            prefersReducedMotion={!!prefersReducedMotion}
            onClose={handleClose}
            phase={phase}
            step={step}
            goToStep={goToStep}
            onHeaderBack={handlePauseHeaderBack}
            showHeaderBack={showPauseHeaderBack}
            macroProgressLine={briefMacroLine}
            stepperSlot={briefStepperSlot}
            breathSecondLabelVariant={breathSecondLabelVariant}
            soundMuted={soundMuted}
            onSoundMutedChange={setSoundMuted}
            ritualEntry={ritualEntry}
            briefRitual={briefRitual}
            deepRitual={deepRitual}
            decision={decision}
            onDoneReturn={handleReturn}
            pauseImpactData={pauseImpactData}
          />
        }
      />
    </PauseSessionGate>
  );
}
