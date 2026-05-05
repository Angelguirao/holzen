import { useState, useRef, useMemo, useCallback, useEffect, Fragment } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { useProGate } from '@/hooks/use-pro-gate';
import { type MoodValue } from '@/components/MoodCheck';

import { type PauseStep } from '@/components/pause/PauseProgress';
import { PauseSessionGate } from '@/components/pause/PauseSessionGate';
import { PauseSessionScaffoldShell } from '@/components/pause/PauseSessionScaffoldShell';
import { PauseEngagedOpenMaxCountdown } from '@/components/pause/PauseEngagedOpenMaxCountdown';
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
  initialPhaseFromRestored,
  initialDecisionFromRestored,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialFrameDoneFromRestored,
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
import { trackEvent } from '@/lib/posthog';
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
import { usePauseSessionTerminalEntryRedirect } from '@/hooks/use-pause-session-terminal-entry-redirect';
import { usePauseSessionMountLog } from '@/hooks/use-pause-session-mount-log';
import { usePauseSessionBriefPastStep } from '@/hooks/use-pause-session-brief-past-step';
import { usePauseSessionGoBack } from '@/hooks/use-pause-session-go-back';
import { usePauseSessionGoToStep } from '@/hooks/use-pause-session-go-to-step';
import { buildPauseSessionScaffoldRitualDerived } from '@/lib/pause-session-scaffold-ritual-props';
import { buildPauseSessionScaffoldRitualPayloads } from '@/lib/pause-session-scaffold-ritual-payloads';
import { buildPauseSessionMountLogParams } from '@/lib/pause-session-mount-log-params';
import { usePauseSessionPendingPauseOfferNavigation } from '@/hooks/use-pause-session-pending-pause-offer-navigation';
import { usePauseSessionDepthPickerHandlers } from '@/hooks/use-pause-session-depth-picker-handlers';
import { usePauseSessionDeepChooseBridgeHandler } from '@/hooks/use-pause-session-deep-choose-bridge-handler';
import { usePauseSessionFeelTilesSelect } from '@/hooks/use-pause-session-feel-tiles-select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * `/pause` route: wires shell hydration, local ritual state, `pause-api` step handlers, and pause UI
 * (`PauseSessionGate*`, `PauseSessionScaffold*`, `PauseSession*RitualBody` under `src/components/pause/`).
 *
 * **This screen (files + modes):** `docs/screens/pause.md`.
 * **Product / data model:** brief vs deep flows, RPCs, and SQL-first ratios on `v_pause_full` /
 * `pause_step_events` — `docs/systems/pause-system.md`.
 * **Supporting modules:** shell hydration (`use-pause-session-shell`, `use-pause-session-fetch`,
 * `pause-session-hydration`, `pause-session-fetched-instance`), hydrate (`pause-session-step-map`),
 * coalesced shell (`pause-session-shell-view-model`), gate predicates
 * (`pause-session-gate-flags`), scaffold ritual payloads + derived shell props
 * (`pause-session-scaffold-ritual-payloads`, `pause-session-scaffold-ritual-props`), mount log snapshot — see
 * **section 10 (Related docs and code)** in `docs/systems/pause-system.md`.
 * **Structure:** thin page + named hooks + `src/lib` — `docs/fundamentals/react-screen-orchestration.md`.
 */
export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleReturn, handleClose } = usePauseSessionExitNavigation(navigate);
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
  const { subscribed, loading: subLoading, refresh: refreshSubscription } = useSubscription();
  const { requirePro } = useProGate();

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

  usePauseSessionMountLog(
    buildPauseSessionMountLogParams({
      restored,
      fetchPauseInstanceId,
      navPauseInstanceId,
      navReflectionMessage,
      hydrationStatus: hydration.status,
    }),
  );

  const { message, context, pauseInstanceId, companions, companionPrefs, severity } =
    coalescePauseSessionShellViewModel(resolved, holzenSeverity);

  const pauseInstanceIdForTerminal =
    pauseInstanceId ?? navPauseInstanceId ?? fetchPauseInstanceId;

  const [leavePauseConfirmOpen, setLeavePauseConfirmOpen] = useState(false);

  const confirmLeavePauseSession = useCallback(() => {
    try {
      trackEvent('pause_session_abandoned', {
        pause_instance_id: pauseInstanceIdForTerminal ?? undefined,
      });
    } catch {
      /* no-op */
    }
    setLeavePauseConfirmOpen(false);
    handleClose();
  }, [handleClose, pauseInstanceIdForTerminal]);

  const hasCoalescedShellMessage = message.length > 0;

  const waitingForFetch = isPauseSessionWaitingForInstanceFetch({
    hydrationStatus: hydration.status,
    fetchFailed,
    fetchedInstance,
  });

  usePauseSessionTerminalEntryRedirect({
    pauseInstanceId: pauseInstanceIdForTerminal,
    shellReady:
      resolved != null ||
      (hydration.status === 'fetch' &&
        !waitingForFetch &&
        fetchedInstance != null &&
        pauseInstanceIdForTerminal != null),
    waitingForFetch,
    fetchFailed,
    fetchPauseInstanceId,
    fetchedInstance,
    restored,
  });

  const restoredStep = mapPersistedStep(restored?.step);

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [decideOnBackStep, setDecideOnBackStep] = useState<'choose' | 'breath2'>(() =>
    initialDecideOnBackStepFromPersisted(restored),
  );
  const [phase, setPhase] = useState<'session' | 'done'>(() => initialPhaseFromRestored(restored));
  const [decision, setDecision] = useState<string | null>(() => initialDecisionFromRestored(restored));
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
  const [breathingFirstCompleted, setBreathingFirstCompleted] = useState(() =>
    initialBreathingFirstCompletedFromRestored(restored),
  );
  const [breathingSecondCompleted, setBreathingSecondCompleted] = useState(() =>
    initialBreathingSecondCompletedFromRestored(restored),
  );
  const [frameDone, setFrameDone] = useState(() => initialFrameDoneFromRestored(restored));
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<PauseImpactData | null>(null);

  const handlePauseSessionChromeClose = useCallback(() => {
    if (phase === 'done') {
      handleReturn();
    } else {
      setLeavePauseConfirmOpen(true);
    }
  }, [phase, handleReturn]);

  usePauseSessionEntryPresentationEffects({ step, setDecideOnBackStep, setCurtainLifted });

  const {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
  } = usePauseBreathSegmentRpcLoggers({
    pauseInstanceId,
    restored,
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

  const handleDepthPickerDeep = useCallback(() => {
    if (!requirePro('deep_pause')) return;
    depthPickerOnDeep();
  }, [requirePro, depthPickerOnDeep]);

  const { handleMoodSelect } = usePauseSessionInitialMoodHandlers({
    pauseInstanceId,
    t,
    lastFeelLogKeyRef,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
    setSelectedBriefFace,
  });

  const { onFeelTilesSelect } = usePauseSessionFeelTilesSelect({
    handleMoodSelect,
    isBriefRitual: ritualEntry === 'brief',
  });

  useEffect(() => {
    if (subLoading) return;
    if (ritualEntry !== 'deep') return;
    if (subscribed) return;
    setRitualEntry('picker');
  }, [subLoading, subscribed, ritualEntry]);

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
  const [soundMuted, setSoundMuted] = useState(true);

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

  const engagedOpenMaxCountdownSlot = useMemo(() => {
    if (phase !== 'session') return undefined;
    const ea = fetchedInstance?.engaged_at;
    if (fetchedInstance?.db_state !== 'engaged' || !ea) return undefined;
    return <PauseEngagedOpenMaxCountdown engagedAtIso={ea} />;
  }, [phase, fetchedInstance?.db_state, fetchedInstance?.engaged_at]);

  const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads({
    briefStep,
    step,
    stepTransition,
    moodDone,
    selectedMood,
    selectedBriefFace,
    feelIntensity,
    onFeelTilesSelect,
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
    <Fragment>
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
              onDeep={handleDepthPickerDeep}
              deepPauseLocked={!subscribed}
              onAboutPauses={depthPickerOnAboutPauses}
              onClose={() => {
                setLeavePauseConfirmOpen(true);
              }}
              aboutSheetOpen={pickerAboutOpen}
              onAboutSheetOpenChange={setPickerAboutOpen}
              aboutSheetTitle={t('pause.aboutPauses.sheetTitle')}
            />
          }
          scaffoldSlot={
            <PauseSessionScaffoldShell
              {...scaffoldRitualDerived}
              countdownSlot={engagedOpenMaxCountdownSlot}
              curtainLifted={curtainLifted}
              prefersReducedMotion={!!prefersReducedMotion}
              onClose={handlePauseSessionChromeClose}
              phase={phase}
              step={step}
              goToStep={goToStep}
              onHeaderBack={handlePauseHeaderBack}
              showHeaderBack={showPauseHeaderBack}
              macroProgressLine={briefMacroLine ?? scaffoldRitualDerived.macroProgressLine}
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
      <AlertDialog open={leavePauseConfirmOpen} onOpenChange={setLeavePauseConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pause.leaveSessionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('pause.leaveSessionDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmLeavePauseSession}>
              {t('pause.leaveSessionConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
