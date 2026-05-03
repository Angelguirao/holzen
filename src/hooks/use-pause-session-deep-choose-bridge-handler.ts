import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { PauseStep } from '@/components/pause/PauseProgress';

/**
 * Deep ritual: after second breath, “Choose” bridge records normal back target
 * (`decide` ← `choose`) then advances to Decide.
 */
export function usePauseSessionDeepChooseBridgeHandler(input: {
  setDecideOnBackStep: Dispatch<SetStateAction<'choose' | 'breath2'>>;
  goToStep: (next: PauseStep) => void;
}): { handleDeepChooseBridgeContinue: () => void } {
  const { setDecideOnBackStep, goToStep } = input;

  const handleDeepChooseBridgeContinue = useCallback(() => {
    setDecideOnBackStep('choose');
    goToStep('decide');
  }, [setDecideOnBackStep, goToStep]);

  return { handleDeepChooseBridgeContinue };
}
