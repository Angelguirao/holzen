import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { PauseStep } from '@/components/pause/PauseProgress';

/**
 * Small presentation-only effects on `/pause` entry: Decide back-target when entering second breath, and curtain reveal.
 */
export function usePauseSessionEntryPresentationEffects(input: {
  step: PauseStep;
  setDecideOnBackStep: Dispatch<SetStateAction<'choose' | 'breath2'>>;
  setCurtainLifted: Dispatch<SetStateAction<boolean>>;
}): void {
  const { step, setDecideOnBackStep, setCurtainLifted } = input;

  useEffect(() => {
    if (step === 'breath2') setDecideOnBackStep('choose');
  }, [step, setDecideOnBackStep]);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, [setCurtainLifted]);
}
