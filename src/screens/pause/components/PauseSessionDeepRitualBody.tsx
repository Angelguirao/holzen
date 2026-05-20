import { AnimatePresence, motion } from 'framer-motion';
import type { MoodValue } from '@/screens/pause/components/MoodCheck';
import { PauseRitualFeelStep } from '@/screens/pause/components/PauseRitualFeelStep';
import type { FeelStepTile } from '@/features/pause/public';
import { PauseBreathing } from '@/screens/pause/components/PauseBreathing';
import { PauseDecide } from '@/screens/pause/components/PauseDecide';
import { PauseFrame } from '@/screens/pause/components/PauseFrame';
import { PauseReflect } from '@/screens/pause/components/PauseReflect';
import { usePauseReflectFrameFocusAmbience } from '@/features/pause/public-hooks';

export type { PauseSessionDeepRitualBodyProps } from '@/features/pause/public';
import type { PauseSessionDeepRitualBodyProps } from '@/features/pause/public';

/** Deep ritual step panels inside `PauseSessionScaffold` (Framer step transitions preserved). */
export function PauseSessionDeepRitualBody({
  step,
  stepTransition,
  moodDone,
  selectedMood,
  selectedBriefFace,
  feelIntensity,
  onFeelTilesSelect,
  goToStep,
  breathingRef,
  mantra,
  severity,
  breathingFirstCompleted,
  breathingSecondCompleted,
  onTimedBreathingChange,
  onFirstBreathPatternComplete,
  onSecondBreathPatternComplete,
  onContinueAfterFirstBreath,
  onContinueAfterSecondBreath,
  onSkipFirstBreath,
  onSkipSecondBreath,
  ritualSoundMuted,
  prefersReducedMotion,
  companions,
  companionPrefs,
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionLoading,
  reflectionError,
  onReflectionRetry,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onFrameImDone,
  onDecide,
  onRepeatDeepFirstBreathPattern,
  onRepeatDeepSecondBreathPattern,
}: PauseSessionDeepRitualBodyProps) {
  usePauseReflectFrameFocusAmbience({
    active: step === 'reflect' || step === 'frame',
    muted: ritualSoundMuted,
    prefersReducedMotion,
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === 'feel' && (
        <motion.div key="feel" {...stepTransition}>
          <PauseRitualFeelStep
            moodDone={moodDone}
            selectedMood={selectedMood}
            selectedTile={selectedBriefFace}
            feelIntensity={feelIntensity}
            onSelect={onFeelTilesSelect}
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
            feelTile={selectedBriefFace}
            completed={breathingFirstCompleted}
            onTimedBreathingChange={onTimedBreathingChange}
            onPatternComplete={onFirstBreathPatternComplete}
            onContinueAfterBreath={onContinueAfterFirstBreath}
            onSkipBreath={onSkipFirstBreath}
            ritualSoundMuted={ritualSoundMuted}
            onRepeatDeepFirstBreathPattern={onRepeatDeepFirstBreathPattern}
          />
        </motion.div>
      )}

      {step === 'reflect' && (
        <motion.div key="reflect" {...stepTransition}>
          <PauseReflect
            pauseInstanceId={pauseInstanceId}
            context={context}
            reflectionMessage={reflectionMessage}
            reflectionLoading={reflectionLoading}
            reflectionError={reflectionError}
            onReflectionRetry={onReflectionRetry}
            companionHaikuEnabled={companionPrefs.haiku}
            isFavorite={isFavorite}
            onToggleFavorite={() => {
              void onToggleFavorite();
            }}
            subscribed={subscribed}
            onContinue={() => goToStep('frame')}
          />
        </motion.div>
      )}

      {step === 'frame' && (
        <motion.div key="frame" {...stepTransition}>
          <PauseFrame
            pauseInstanceId={pauseInstanceId}
            reflectionMessage={reflectionMessage}
            companionHaikuEnabled={companionPrefs.haiku}
            isFavorite={isFavorite}
            onToggleFavorite={() => {
              void onToggleFavorite();
            }}
            subscribed={subscribed}
            onImDone={onFrameImDone}
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
            feelTile={selectedBriefFace}
            completed={breathingSecondCompleted}
            onTimedBreathingChange={onTimedBreathingChange}
            onPatternComplete={onSecondBreathPatternComplete}
            onContinueAfterBreath={onContinueAfterSecondBreath}
            onSkipBreath={onSkipSecondBreath}
            ritualSoundMuted={ritualSoundMuted}
            onRepeatDeepSecondBreathPattern={onRepeatDeepSecondBreathPattern}
          />
        </motion.div>
      )}

      {step === 'decide' && (
        <motion.div key="decide" {...stepTransition}>
          <PauseDecide onDecide={onDecide} onBack={() => goToStep('breath2')} hideChoicesBack />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
