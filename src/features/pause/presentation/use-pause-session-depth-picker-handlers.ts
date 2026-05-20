import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  BRIEF_DEPTH_PICKER_RITUAL_ENTRY,
  DEEP_DEPTH_PICKER_RITUAL_ENTRY,
} from '@/features/pause/application/use-cases/ritual/feel/pause-session-mood-chrome-flow';
import { type BriefPauseStep, type RitualDepth } from '@/features/pause/public';

/** `PauseDepthPicker` actions on `/pause` depth selection screen. */
export function usePauseSessionDepthPickerHandlers(input: {
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
}): {
  onBrief: () => void;
  onDeep: () => void;
} {
  const { setRitualEntry, setBriefStep } = input;

  const onBrief = useCallback(() => {
    setRitualEntry(BRIEF_DEPTH_PICKER_RITUAL_ENTRY.ritualEntry);
    setBriefStep(BRIEF_DEPTH_PICKER_RITUAL_ENTRY.briefStep);
  }, [setRitualEntry, setBriefStep]);

  const onDeep = useCallback(() => {
    setRitualEntry(DEEP_DEPTH_PICKER_RITUAL_ENTRY.ritualEntry);
  }, [setRitualEntry]);

  return { onBrief, onDeep };
}
