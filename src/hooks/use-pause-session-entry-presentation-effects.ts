import { useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * Presentation-only effects on `/pause` entry (curtain reveal).
 */
export function usePauseSessionEntryPresentationEffects(input: {
  setCurtainLifted: Dispatch<SetStateAction<boolean>>;
}): void {
  const { setCurtainLifted } = input;

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, [setCurtainLifted]);
}
