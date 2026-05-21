import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';

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
    applyBriefDepthPickerRitualEntry({ setRitualEntry, setBriefStep });
  }, [setRitualEntry, setBriefStep]);

  const onDeep = useCallback(() => {
    applyDeepDepthPickerRitualEntry({ setRitualEntry });
  }, [setRitualEntry]);

  return { onBrief, onDeep };
}
