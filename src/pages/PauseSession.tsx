import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { hapticFeedback } from '@/lib/haptics';
import { type MoodValue } from '@/components/MoodCheck';
import { type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';

import {
  type PauseStep,
  STEPS,
  pauseDeepMacroStepNumber,
  PAUSE_DEEP_DISPLAY_STEP_COUNT,
} from '@/components/pause/PauseProgress';
import { PauseSessionGate } from '@/components/pause/PauseSessionGate';
import { PauseSessionScaffold } from '@/components/pause/PauseSessionScaffold';
import { PendingPauseOfferShell } from '@/components/pause/PendingPauseOfferShell';
import { PauseFeel } from '@/components/pause/PauseFeel';
import { PauseBreathing, type PauseBreathingHandle } from '@/components/pause/PauseBreathing';
import { PauseReflect } from '@/components/pause/PauseReflect';
import { PauseFrame } from '@/components/pause/PauseFrame';
import { PauseChooseBridge } from '@/components/pause/PauseChooseBridge';
import { PauseDecide } from '@/components/pause/PauseDecide';
import { PauseDone } from '@/components/pause/PauseDone';
import { PauseDepthPicker } from '@/components/pause/PauseDepthPicker';
import { PauseBriefProgress } from '@/components/pause/PauseBriefProgress';
import { computePauseGoBackPlan } from '@/lib/pause-go-back-plan';
import { pauseStepSwipeDirection } from '@/lib/pause-step-swipe-direction';
import { isPauseSessionHeaderBackVisible } from '@/lib/pause-session-header-back';
import { PauseBriefFeel, type BriefFeelTile } from '@/components/pause/PauseBriefFeel';
import { PauseBriefIntegrate } from '@/components/pause/PauseBriefIntegrate';
import { PauseAboutPausesBody } from '@/components/pause/PauseAboutPausesBody';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';
import {
  mapPersistedStep,
  initialRitualEntry,
  briefStepToPauseScienceStep,
} from '@/lib/pause-session-step-map';
import { initialDecideOnBackStepFromPersisted } from '@/lib/pause-session-initial-decide-on-back-step';
import { parsePauseSessionLocationState } from '@/lib/router-location-state';
import { clearSession } from '@/lib/pause-session-storage';
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
import { showPauseStepSyncFailedToast } from '@/lib/pause-step-sync-toast';
import { usePauseSessionShell } from '@/hooks/use-pause-session-shell';
import { usePauseSessionMountLog } from '@/hooks/use-pause-session-mount-log';
import { usePauseSessionBriefPastStep } from '@/hooks/use-pause-session-brief-past-step';

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
  });

  const { message, context, pauseInstanceId, companions, companionPrefs, severity } =
    coalescePauseSessionShellViewModel(resolved, holzenSeverity);

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
  const [briefStep, setBriefStep] = useState<BriefPauseStep>(() => {
    if (restored?.ritualDepth === 'brief' && restored.briefStep) return restored.briefStep;
    return 'feel';
  });
  const [briefIntegrateDone, setBriefIntegrateDone] = useState(restored?.briefIntegrateDone ?? false);
  const [selectedBriefFace, setSelectedBriefFace] = useState<BriefFeelTile | null>(
    (restored?.briefFace as BriefFeelTile | null) ?? null,
  );
  const [pickerAboutOpen, setPickerAboutOpen] = useState(false);

  const { handleMoodSelect, handleMoodSkip, handleMoodReset } = usePauseSessionInitialMoodHandlers({
    pauseInstanceId,
    t,
    lastFeelLogKeyRef,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
    setSelectedBriefFace,
  });

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

  const goToStep = useCallback(
    (next: PauseStep) => {
      setSwipeDirection(pauseStepSwipeDirection(step, next));
      hapticFeedback('light');
      setStep(next);
    },
    [step],
  );

  const { handleFrameImDone } = usePauseShiftFrameDoneHandler({
    pauseInstanceId,
    t,
    lastShiftLogKeyRef,
    setFrameDone,
    setMoodAfterDone,
    goToStep,
  });

  const goBack = useCallback(() => {
    const plan = computePauseGoBackPlan(ritualEntry, briefStep, step);
    if (plan.kind === 'none') return;
    setSwipeDirection('back');
    hapticFeedback('light');
    if (plan.kind === 'brief') {
      if (plan.clearBriefIntegrateDone) setBriefIntegrateDone(false);
      setBriefStep(plan.prev);
    } else {
      setStep(plan.prev);
    }
  }, [step, ritualEntry, briefStep]);

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
    hasShellMessage: !!message,
  });

  return (
    <PauseSessionGate
      hasMessage={!!message}
      phase={phase}
      waitingForFetch={waitingForFetch}
      fetchFailed={fetchFailed}
      hydrationStatus={hydration.status}
      profileLoaded={profileLoaded}
      onReturn={handleReturn}
    >
      <>
        <PendingPauseOfferShell
          onAfterMutation={() => void resyncOpenPauseFromDb()}
          navigateAfterAdopt={(instanceId) => {
            clearSession();
            navigate('/pause', { state: { pauseInstanceId: instanceId }, replace: true });
          }}
        />
        {sessionOnPicker ? (
          <>
            <PauseDepthPicker
              contextLine={depthContextLine}
              onBrief={() => {
                setRitualEntry('brief');
                setBriefStep('feel');
              }}
              onDeep={() => setRitualEntry('deep')}
              onAboutPauses={() => setPickerAboutOpen(true)}
              onClose={handleClose}
            />
            <Sheet open={pickerAboutOpen} onOpenChange={setPickerAboutOpen}>
              <SheetContent
                side="bottom"
                className="z-[120] max-h-[88vh] overflow-y-auto rounded-t-2xl border-t p-6 sm:p-8"
              >
                <SheetTitle className="sr-only">{t('pause.aboutPauses.sheetTitle')}</SheetTitle>
                <PauseAboutPausesBody />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <PauseSessionScaffold
            curtainLifted={curtainLifted}
            prefersReducedMotion={!!prefersReducedMotion}
            onClose={handleClose}
            phase={phase}
            step={step}
            goToStep={goToStep}
            onHeaderBack={handlePauseHeaderBack}
            showHeaderBack={showPauseHeaderBack}
            macroStepIndex={ritualEntry === 'brief' ? undefined : pauseDeepMacroStepNumber(step)}
            macroStepTotal={ritualEntry === 'brief' ? undefined : PAUSE_DEEP_DISPLAY_STEP_COUNT}
            macroProgressLine={briefMacroLine}
            sessionTitle={ritualEntry === 'brief' ? t('pause.brief.sessionTitle') : undefined}
            stepperSlot={
              ritualEntry === 'brief' ? (
                <PauseBriefProgress currentStep={briefStep} onStepClick={goToBriefPastStep} />
              ) : undefined
            }
            scienceCurrentStep={ritualEntry === 'brief' ? briefStepToPauseScienceStep(briefStep) : undefined}
            breathSecondLabelVariant={breathSecondLabelVariant}
            hideScienceButton={
              ritualEntry === 'brief'
                ? briefStep === 'breath'
                : step === 'breathe' || step === 'breath2'
            }
            soundMuted={soundMuted}
            onSoundMutedChange={setSoundMuted}
          >
            {phase === 'session' && ritualEntry === 'brief' && (
              <AnimatePresence mode="wait" initial={false}>
                {briefStep === 'feel' && (
                  <motion.div key="b-feel" {...stepTransition}>
                    <PauseBriefFeel
                      moodDone={moodDone}
                      selectedMood={selectedMood}
                      selectedTile={selectedBriefFace}
                      feelIntensity={feelIntensity}
                      onSelect={(mood, intensity, tile) =>
                        void handleMoodSelect(mood, intensity, { briefRitual: true, briefFace: tile })
                      }
                      onContinue={() => setBriefStep('breath')}
                    />
                  </motion.div>
                )}

                {briefStep === 'breath' && (
                  <motion.div key="b-breath" {...stepTransition}>
                    <PauseBreathing
                      ref={breathingRef}
                      key="breath-brief"
                      breathSegment="first"
                      ritualVariant="brief"
                      mantra={mantra}
                      severity={severity}
                      completed={breathingFirstCompleted}
                      onTimedBreathingChange={setBreathTimedActive}
                      onPatternComplete={() => setBreathingFirstCompleted(true)}
                      onContinueAfterBreath={() => void handleBriefBreathContinue()}
                      onSkipBreath={handleBriefSkipBreath}
                      ritualSoundMuted={soundMuted}
                    />
                  </motion.div>
                )}

                {briefStep === 'integrate' && (
                  <motion.div key="b-integrate" {...stepTransition}>
                    <PauseBriefIntegrate done={briefIntegrateDone} onComplete={handleBriefIntegrateComplete} />
                  </motion.div>
                )}

                {briefStep === 'decide' && (
                  <motion.div key="b-decide" {...stepTransition}>
                    <PauseDecide
                      onDecide={handleDecide}
                      onBack={() => setBriefStep('integrate')}
                      introKicker={t('pause.brief.decideKicker', { defaultValue: 'Step 4 · Decide' })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {phase === 'session' && ritualEntry === 'deep' && (
              <AnimatePresence mode="wait" initial={false}>
                {step === 'feel' && (
                  <motion.div key="feel" {...stepTransition}>
                    <PauseFeel
                      onMoodSelect={handleMoodSelect}
                      onMoodSkip={handleMoodSkip}
                      onMoodReset={handleMoodReset}
                      moodDone={moodDone}
                      selectedMood={selectedMood}
                      feelIntensity={feelIntensity}
                      onContinue={() => goToStep('breathe')}
                    />
                  </motion.div>
                )}

                {step === 'breathe' && (
                  <motion.div key="breathe" {...stepTransition}>
                    <PauseBreathing
                      ref={breathingRef}
                      key="breath-segment-first"
                      breathSegment="first"
                      ritualVariant="deep"
                      mantra={mantra}
                      severity={severity}
                      completed={breathingFirstCompleted}
                      onTimedBreathingChange={setBreathTimedActive}
                      onPatternComplete={() => setBreathingFirstCompleted(true)}
                      onContinueAfterBreath={() => void handleContinueAfterFirstBreath()}
                      onSkipBreath={handleSkipFirstBreath}
                      ritualSoundMuted={soundMuted}
                    />
                  </motion.div>
                )}

                {step === 'reflect' && (
                  <motion.div key="reflect" {...stepTransition}>
                    <PauseReflect
                      companions={companions}
                      companionPrefs={companionPrefs}
                      severity={severity}
                      pauseInstanceId={pauseInstanceId}
                      context={context}
                      reflectionMessage={message}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                      subscribed={subscribed}
                      onContinue={() => goToStep('frame')}
                      mood={selectedMood}
                    />
                  </motion.div>
                )}

                {step === 'frame' && (
                  <motion.div key="frame" {...stepTransition}>
                    <PauseFrame
                      companions={companions}
                      pauseInstanceId={pauseInstanceId}
                      reflectionMessage={message}
                      onImDone={() => void handleFrameImDone()}
                    />
                  </motion.div>
                )}

                {step === 'breath2' && (
                  <motion.div key="breath2" {...stepTransition}>
                    <PauseBreathing
                      ref={breathingRef}
                      key="breath-segment-second"
                      breathSegment="second"
                      ritualVariant="deep"
                      mantra={mantra}
                      severity={severity}
                      completed={breathingSecondCompleted}
                      onTimedBreathingChange={setBreathTimedActive}
                      onPatternComplete={() => setBreathingSecondCompleted(true)}
                      onContinueAfterBreath={() => void handleContinueAfterSecondBreath()}
                      onSkipBreath={handleSkipSecondBreath}
                      ritualSoundMuted={soundMuted}
                    />
                  </motion.div>
                )}

                {step === 'choose' && (
                  <motion.div key="choose" {...stepTransition}>
                    <PauseChooseBridge
                      onChoose={() => {
                        setDecideOnBackStep('choose');
                        goToStep('decide');
                      }}
                    />
                  </motion.div>
                )}

                {step === 'decide' && (
                  <motion.div key="decide" {...stepTransition}>
                    <PauseDecide onDecide={handleDecide} onBack={() => goToStep(decideOnBackStep)} />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {phase === 'done' && (
              <PauseDone decision={decision} onReturn={handleReturn} pauseData={pauseImpactData} />
            )}
          </PauseSessionScaffold>
        )}
      </>
    </PauseSessionGate>
  );
}
