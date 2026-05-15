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
import { clearSession, type BriefPauseStep, type RitualDepth } from '@/lib/pause-session-storage';
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
import { pauseAdoptPendingOffer, pauseDeclinePendingOffer } from '@/lib/pause-api';
import { toast } from 'sonner';
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
import { usePauseSessionGoBack } from '@/hooks/use-pause-session-go-back';
import { usePauseSessionGoToStep } from '@/hooks/use-pause-session-go-to-step';
import { buildPauseSessionScaffoldRitualDerived } from '@/lib/pause-session-scaffold-ritual-props';
import { buildPauseSessionScaffoldRitualPayloads } from '@/lib/pause-session-scaffold-ritual-payloads';
import { journeyPath } from '@/lib/app-routes';
import { buildPauseSessionMountLogParams } from '@/lib/pause-session-mount-log-params';
import { usePauseSessionPendingPauseOfferNavigation } from '@/hooks/use-pause-session-pending-pause-offer-navigation';
import { usePendingPauseOffer } from '@/hooks/use-pending-pause-offer';
import { usePauseSessionDepthPickerHandlers } from '@/hooks/use-pause-session-depth-picker-handlers';
import { usePauseSessionDeepChooseBridgeHandler } from '@/hooks/use-pause-session-deep-choose-bridge-handler';
import { usePauseSessionFeelTilesSelect } from '@/hooks/use-pause-session-feel-tiles-select';
import { PauseLeaveWithPendingSheet } from '@/components/pause/PauseLeaveWithPendingSheet';

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
  const handleBriefSaveToJourney = useCallback(() => {
    clearSession();
    navigate(journeyPath('stats'), { replace: true });
  }, [navigate]);
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
  const { pending, refresh: refreshPendingOffer } = usePendingPauseOffer();

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

  const [leaveWithPendingOpen, setLeaveWithPendingOpen] = useState(false);
  const [leaveSheetBusy, setLeaveSheetBusy] = useState(false);

  const confirmLeavePauseSession = useCallback(() => {
    try {
      trackEvent('pause_session_abandoned', {
        pause_instance_id: pauseInstanceIdForTerminal ?? undefined,
      });
    } catch {
      /* no-op */
    }
    setLeaveWithPendingOpen(false);
    handleClose();
  }, [handleClose, pauseInstanceIdForTerminal]);

  const requestExitPauseBeforeDone = useCallback(() => {
    if (pending) {
      setLeaveWithPendingOpen(true);
      return;
    }
    confirmLeavePauseSession();
  }, [pending, confirmLeavePauseSession]);

  const handleDeclinePendingFromLeaveSheet = useCallback(async () => {
    if (!pending || leaveSheetBusy) return;
    setLeaveSheetBusy(true);
    try {
      await pauseDeclinePendingOffer();
      try {
        trackEvent('pause_pending_declined', { pause_instance_id: pending.id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(pendingOfferAfterMutation());
      setLeaveWithPendingOpen(false);
      await refreshPendingOffer();
    } catch {
      toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
    } finally {
      setLeaveSheetBusy(false);
    }
  }, [pending, leaveSheetBusy, t, pendingOfferAfterMutation, refreshPendingOffer]);

  const handlePendingAdoptFromLeaveSheet = useCallback(async () => {
    if (!pending || leaveSheetBusy) return;
    setLeaveSheetBusy(true);
    try {
      const r = await pauseAdoptPendingOffer();
      if (!r.ok || !r.instance_id) {
        toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
        return;
      }
      try {
        trackEvent('pause_pending_adopted', { pause_instance_id: r.instance_id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(pendingOfferAfterMutation());
      pendingOfferNavigateAfterAdopt(r.instance_id);
      setLeaveWithPendingOpen(false);
      await refreshPendingOffer();
    } catch {
      toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
    } finally {
      setLeaveSheetBusy(false);
    }
  }, [
    pending,
    leaveSheetBusy,
    t,
    pendingOfferAfterMutation,
    pendingOfferNavigateAfterAdopt,
    refreshPendingOffer,
  ]);

  const hasCoalescedShellMessage = message.length > 0;

  const waitingForFetch = isPauseSessionWaitingForInstanceFetch({
    hydrationStatus: hydration.status,
    fetchFailed,
    fetchedInstance,
  });

  const restoredStep = mapPersistedStep(restored?.step);

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [decideOnBackStep, setDecideOnBackStep] = useState<'choose' | 'breath2'>(() =>
    initialDecideOnBackStepFromPersisted(restored),
  );
  const [phase, setPhase] = useState<'session' | 'done'>(() => initialPhaseFromRestored(restored));
  const [decision, setDecision] = useState<string | null>(() => initialDecisionFromRestored(restored));

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
    pauseSessionPhase: phase,
  });

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
      requestExitPauseBeforeDone();
    }
  }, [phase, handleReturn, requestExitPauseBeforeDone]);

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
  const { onBrief: depthPickerOnBrief, onDeep: depthPickerOnDeep } = usePauseSessionDepthPickerHandlers({
    setRitualEntry,
    setBriefStep,
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

  const handleBriefRepeatBreaths = useCallback(() => {
    setSwipeDirection('back');
    setBriefIntegrateDone(false);
    setBreathingFirstCompleted(false);
    setBreathTimedActive(false);
    setBriefStep('breath');
    queueMicrotask(() => breathingRef.current?.resetToIntro());
  }, [breathingRef, setSwipeDirection, setBriefIntegrateDone, setBreathingFirstCompleted, setBreathTimedActive, setBriefStep]);

  const handleBriefSwitchToDeepPause = useCallback(() => {
    if (!requirePro('deep_pause')) return;
    setSwipeDirection('forward');
    setRitualEntry('deep');
    setStep('breathe');
    setBriefStep('feel');
    setBriefIntegrateDone(false);
    setBreathingFirstCompleted(false);
    setBreathingSecondCompleted(false);
    setBreathTimedActive(false);
    setFrameDone(false);
    setMoodAfterDone(false);
    setDecideOnBackStep('choose');
    queueMicrotask(() => breathingRef.current?.resetToIntro());
  }, [
    breathingRef,
    requirePro,
    setSwipeDirection,
    setRitualEntry,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathTimedActive,
    setFrameDone,
    setMoodAfterDone,
    setDecideOnBackStep,
  ]);

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
    hasShellMessage: hasCoalescedShellMessage,
  });

  const scaffoldRitualDerived = buildPauseSessionScaffoldRitualDerived({
    ritualEntry,
    step,
    briefStep: ritualEntry === 'brief' ? briefStep : undefined,
    severity,
    t,
  });

  const briefStepperSlot = useMemo(
    () => (ritualEntry === 'brief' ? <PauseBriefProgress currentStep={briefStep} /> : undefined),
    [ritualEntry, briefStep],
  );

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
    handleBriefRepeatBreaths,
    handleBriefSwitchToDeepPause,
    handleDecide,
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
          sessionOnPicker={sessionOnPicker}
          depthPickerSlot={
            <PauseSessionDepthPickerStack
              contextLine={depthContextLine}
              onBrief={depthPickerOnBrief}
              onDeep={handleDepthPickerDeep}
              deepPauseLocked={!subscribed}
              onClose={requestExitPauseBeforeDone}
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
              onHeaderBack={handlePauseHeaderBack}
              showHeaderBack={showPauseHeaderBack}
              stepperSlot={briefStepperSlot}
              breathSecondLabelVariant={breathSecondLabelVariant}
              soundMuted={soundMuted}
              onSoundMutedChange={setSoundMuted}
              ritualEntry={ritualEntry}
              briefRitual={briefRitual}
              deepRitual={deepRitual}
              decision={decision}
              onDoneReturn={handleReturn}
              onSaveToJourney={ritualEntry === 'brief' ? handleBriefSaveToJourney : undefined}
              pauseImpactData={pauseImpactData}
            />
          }
        />
      </PauseSessionGate>
      <PauseLeaveWithPendingSheet
        open={leaveWithPendingOpen}
        onOpenChange={setLeaveWithPendingOpen}
        pending={pending}
        busy={leaveSheetBusy}
        onStay={() => setLeaveWithPendingOpen(false)}
        onLeave={() => {
          confirmLeavePauseSession();
        }}
        onSwitchToBrief={() => {
          setLeaveWithPendingOpen(false);
          setRitualEntry('brief');
          setBriefStep('feel');
          setStep('feel');
        }}
        onAdoptNew={() => void handlePendingAdoptFromLeaveSheet()}
        onDismissPendingOffer={() => void handleDeclinePendingFromLeaveSheet()}
      />
    </Fragment>
  );
}
