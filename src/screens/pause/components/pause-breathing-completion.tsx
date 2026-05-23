import { BriefBreathAdvanceToIntegrate } from '@/screens/pause/components/brief-breath-advance-to-integrate';
import { DeepBreathPostPatternInterstitial } from '@/screens/pause/components/deep-breath-post-pattern-interstitial';
import type { PauseBreathSegment } from '@/screens/pause/components/pause-breath-intro';

export type PauseBreathingCompletionProps = {
  ritualVariant: 'brief' | 'deep' | undefined;
  breathSegment: PauseBreathSegment;
  prefersReducedMotion: boolean;
  onContinueAfterBreath: () => void;
  onAdvanceFailed: () => void;
  onRepeatDeepFirstBreathPattern?: () => void;
  onRepeatDeepSecondBreathPattern?: () => void;
};

/** Post-pattern completion UI for brief (integrate) vs deep (interstitial). */
export function PauseBreathingCompletion({
  ritualVariant,
  breathSegment,
  prefersReducedMotion,
  onContinueAfterBreath,
  onAdvanceFailed,
  onRepeatDeepFirstBreathPattern,
  onRepeatDeepSecondBreathPattern,
}: PauseBreathingCompletionProps) {
  if (ritualVariant === 'brief') {
    return (
      <BriefBreathAdvanceToIntegrate onContinue={onContinueAfterBreath} onAdvanceFailed={onAdvanceFailed} />
    );
  }

  if (ritualVariant === 'deep') {
    return (
      <DeepBreathPostPatternInterstitial
        segment={breathSegment}
        prefersReducedMotion={prefersReducedMotion}
        onContinueAfterBreath={onContinueAfterBreath}
        onRepeatPattern={
          breathSegment === 'first' ? onRepeatDeepFirstBreathPattern : onRepeatDeepSecondBreathPattern
        }
      />
    );
  }

  return null;
}
