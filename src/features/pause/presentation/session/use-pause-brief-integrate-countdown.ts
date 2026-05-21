import { useEffect, useRef, useState } from 'react';
import { BRIEF_INTEGRATE_SECONDS } from '@/features/pause/application/use-cases/ritual/brief/brief-integrate-timer';

export function usePauseBriefIntegrateCountdown(done: boolean, onComplete: () => void) {
  const [remaining, setRemaining] = useState(BRIEF_INTEGRATE_SECONDS);
  const autoFired = useRef(false);

  useEffect(() => {
    if (done) {
      setRemaining(0);
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (done || remaining > 0 || autoFired.current) return;
    autoFired.current = true;
    onComplete();
  }, [remaining, done, onComplete]);

  const suppressAutoComplete = () => {
    autoFired.current = true;
  };

  return { remaining, suppressAutoComplete };
}
