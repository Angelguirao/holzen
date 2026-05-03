import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

/** `PauseDepthPicker` actions on `/pause` depth selection screen. */
export function usePauseSessionDepthPickerHandlers(input: {
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setPickerAboutOpen: Dispatch<SetStateAction<boolean>>;
}): {
  onBrief: () => void;
  onDeep: () => void;
  onAboutPauses: () => void;
} {
  const { setRitualEntry, setBriefStep, setPickerAboutOpen } = input;

  const onBrief = useCallback(() => {
    setRitualEntry('brief');
    setBriefStep('feel');
  }, [setRitualEntry, setBriefStep]);

  const onDeep = useCallback(() => {
    setRitualEntry('deep');
  }, [setRitualEntry]);

  const onAboutPauses = useCallback(() => {
    setPickerAboutOpen(true);
  }, [setPickerAboutOpen]);

  return { onBrief, onDeep, onAboutPauses };
}
