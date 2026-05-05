import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { MoodValue } from '@/components/MoodCheck';
import { PauseBreathing, type PauseBreathingHandle } from '@/components/pause/PauseBreathing';
import { PauseBriefFeel, type BriefFeelTile } from '@/components/pause/PauseBriefFeel';
import { PauseBriefIntegrate } from '@/components/pause/PauseBriefIntegrate';
import { PauseDecide } from '@/components/pause/PauseDecide';
import type { PauseSessionStepTransitionConfig } from '@/lib/pause-session-step-transition';
import type { BriefPauseStep } from '@/lib/pause-session-storage';

export type PauseSessionBriefRitualBodyProps = {
  briefStep: BriefPauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: BriefFeelTile | null;
  feelIntensity: number | null;
  onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: BriefFeelTile) => void;
  onBriefFeelContinueToBreath: () => void;
  breathingRef: RefObject<PauseBreathingHandle | null>;
  mantra: string | null;
  severity: 'mild' | 'moderate' | 'high';
  breathingFirstCompleted: boolean;
  onTimedBreathingChange: (active: boolean) => void;
  onBriefBreathPatternComplete: () => void;
  onContinueAfterBriefBreath: () => void;
  onSkipBriefBreath: () => void;
  ritualSoundMuted: boolean;
  briefIntegrateDone: boolean;
  onBriefIntegrateComplete: () => void;
  onDecide: (decision: string) => void;
  onBriefDecideBack: () => void;
  briefDecideIntroKicker: string;
};

/** Brief ritual step panels inside `PauseSessionScaffold` (Framer step transitions preserved). */
export function PauseSessionBriefRitualBody({
  briefStep,
  stepTransition,
  moodDone,
  selectedMood,
  selectedBriefFace,
  feelIntensity,
  onFeelTilesSelect,
  onBriefFeelContinueToBreath,
  breathingRef,
  mantra,
  severity,
  breathingFirstCompleted,
  onTimedBreathingChange,
  onBriefBreathPatternComplete,
  onContinueAfterBriefBreath,
  onSkipBriefBreath,
  ritualSoundMuted,
  briefIntegrateDone,
  onBriefIntegrateComplete,
  onDecide,
  onBriefDecideBack,
  briefDecideIntroKicker,
}: PauseSessionBriefRitualBodyProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {briefStep === 'feel' && (
        <motion.div key="b-feel" {...stepTransition}>
          <PauseBriefFeel
            moodDone={moodDone}
            selectedMood={selectedMood}
            selectedTile={selectedBriefFace}
            feelIntensity={feelIntensity}
            onSelect={onFeelTilesSelect}
            onContinue={onBriefFeelContinueToBreath}
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
            onTimedBreathingChange={onTimedBreathingChange}
            onPatternComplete={onBriefBreathPatternComplete}
            onContinueAfterBreath={onContinueAfterBriefBreath}
            onSkipBreath={onSkipBriefBreath}
            ritualSoundMuted={ritualSoundMuted}
          />
        </motion.div>
      )}

      {briefStep === 'integrate' && (
        <motion.div key="b-integrate" {...stepTransition}>
          <PauseBriefIntegrate done={briefIntegrateDone} onComplete={onBriefIntegrateComplete} />
        </motion.div>
      )}

      {briefStep === 'decide' && (
        <motion.div key="b-decide" {...stepTransition}>
          <PauseDecide
            onDecide={onDecide}
            onBack={onBriefDecideBack}
            introKicker={briefDecideIntroKicker}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
