import { useLayoutEffect, useRef } from 'react';

export type BriefBreathAdvanceToIntegrateProps = {
  onContinue: () => void | Promise<unknown>;
  onAdvanceFailed?: () => void;
};

/** Brief ritual: no post-pattern card; advance as soon as the timed cycles finish. */
export function BriefBreathAdvanceToIntegrate({
  onContinue,
  onAdvanceFailed,
}: BriefBreathAdvanceToIntegrateProps) {
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;
  const onAdvanceFailedRef = useRef(onAdvanceFailed);
  onAdvanceFailedRef.current = onAdvanceFailed;
  const firedRef = useRef(false);
  useLayoutEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void Promise.resolve(onContinueRef.current()).catch(() => {
      firedRef.current = false;
      onAdvanceFailedRef.current?.();
    });
  }, []);
  return null;
}
