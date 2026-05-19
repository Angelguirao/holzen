import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import type { MoodValue } from '@/components/MoodCheck';
import { PauseBreathing, type PauseBreathingHandle } from '@/screens/pause/components/PauseBreathing';
import { PauseRitualFeelStep } from '@/screens/pause/components/PauseRitualFeelStep';
import type { FeelStepTile } from '@/screens/pause/components/pause-feel-types';
import { PauseBriefIntegrate } from '@/screens/pause/components/PauseBriefIntegrate';
import { PauseDecide } from '@/screens/pause/components/PauseDecide';
import type { PauseSessionStepTransitionConfig } from '@/features/pause/public';
import { type BriefPauseStep } from '@/features/pause/public';

export type PauseSessionBriefRitualBodyProps = {
  briefStep: BriefPauseStep;
  stepTransition: PauseSessionStepTransitionConfig;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  feelIntensity: number | null;
  onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: FeelStepTile) => void;
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
  onBriefRepeatBreaths: () => void;
  onBriefSwitchToDeepPause: () => void;
  deepPauseLocked: boolean;
  onDecide: (decision: string) => void;
  onBriefDecideBack: () => void;
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
  onBriefRepeatBreaths,
  onBriefSwitchToDeepPause,
  deepPauseLocked,
  onDecide,
  onBriefDecideBack,
}: PauseSessionBriefRitualBodyProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {briefStep === 'feel' && (
        <motion.div key="b-feel" {...stepTransition}>
          <PauseRitualFeelStep
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
            feelTile={selectedBriefFace}
          />
        </motion.div>
      )}

      {briefStep === 'integrate' && (
        <motion.div key="b-integrate" {...stepTransition}>
          <PauseBriefIntegrate
            done={briefIntegrateDone}
            onComplete={onBriefIntegrateComplete}
            onRepeatBreaths={onBriefRepeatBreaths}
            onSwitchToDeepPause={onBriefSwitchToDeepPause}
            deepPauseLocked={deepPauseLocked}
          />
        </motion.div>
      )}

      {briefStep === 'decide' && (
        <motion.div key="b-decide" {...stepTransition}>
          <PauseDecide onDecide={onDecide} onBack={onBriefDecideBack} hideChoicesBack />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
