import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { MoodValue } from '@/components/MoodCheck';
import { PauseRitualFeelStep } from '@/components/pause/PauseRitualFeelStep';
import type { FeelStepTile } from '@/components/pause/pause-feel-types';
import { PauseBreathing, type PauseBreathingHandle } from '@/components/pause/PauseBreathing';
import { PauseDecide } from '@/components/pause/PauseDecide';
import { PauseFrame } from '@/components/pause/PauseFrame';
import { PauseReflect } from '@/components/pause/PauseReflect';
import type { PauseStep } from '@/components/pause/PauseProgress';
import type { PauseSessionStepTransitionConfig } from '@/features/pause/application/session/step-transition';
import { usePauseReflectFrameFocusAmbience } from '@/hooks/use-pause-reflect-frame-focus-ambience';

export type PauseSessionDeepRitualBodyProps = {
  step: PauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  feelIntensity: number | null;
  onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: FeelStepTile) => void;
  goToStep: (next: PauseStep) => void;
  breathingRef: RefObject<PauseBreathingHandle | null>;
  mantra: string | null;
  severity: 'mild' | 'moderate' | 'high';
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  onTimedBreathingChange: (active: boolean) => void;
  onFirstBreathPatternComplete: () => void;
  onSecondBreathPatternComplete: () => void;
  onContinueAfterFirstBreath: () => void;
  onContinueAfterSecondBreath: () => void;
  onSkipFirstBreath: () => void;
  onSkipSecondBreath: () => void;
  ritualSoundMuted: boolean;
  /** When true, ritual audio (including Reflect/Frame focus bed) is off. */
  prefersReducedMotion: boolean;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionLoading?: boolean;
  reflectionError?: string | null;
  onReflectionRetry?: () => void;
  isFavorite: boolean;
  /** Reflect forwards to favorite control; async ok. */
  onToggleFavorite: () => void | Promise<void>;
  subscribed: boolean;
  onFrameImDone: () => void;
  onDecide: (decision: string) => void;
  /** After first deep breath pattern: repeat three rounds from intro (wireframe “Three more”). */
  onRepeatDeepFirstBreathPattern: () => void;
  /** After second deep breath pattern: repeat three rounds from intro (wireframe 330:23551). */
  onRepeatDeepSecondBreathPattern: () => void;
};

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
