import { AnimatePresence, motion } from 'framer-motion';
import type { MoodValue } from '@/screens/pause/components/MoodCheck';
import { PauseBreathing } from '@/screens/pause/components/PauseBreathing';
import type { PauseBreathingHandle } from '@/features/pause/public-hooks';
import { PauseRitualFeelStep } from '@/screens/pause/components/PauseRitualFeelStep';
import type { FeelStepTile } from '@/features/pause/public-hooks';
import { PauseBriefIntegrate } from '@/screens/pause/components/PauseBriefIntegrate';
import { PauseDecide } from '@/screens/pause/components/PauseDecide';
import type { PauseSessionStepTransitionConfig } from '@/features/pause/public-hooks';
import { type BriefPauseStep } from '@/features/pause/public-hooks';

export type { PauseSessionBriefRitualBodyProps } from '@/features/pause/public-hooks';
import type { PauseSessionBriefRitualBodyProps } from '@/features/pause/public-hooks';

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
