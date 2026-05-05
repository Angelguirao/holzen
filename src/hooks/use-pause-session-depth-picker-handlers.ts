import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

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
    setRitualEntry('brief');
    setBriefStep('feel');
  }, [setRitualEntry, setBriefStep]);

  const onDeep = useCallback(() => {
    setRitualEntry('deep');
  }, [setRitualEntry]);

  return { onBrief, onDeep };
}
