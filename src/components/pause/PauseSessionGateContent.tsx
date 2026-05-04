import type { ReactNode } from 'react';
import { PendingPauseOfferShell } from '@/components/pause/PendingPauseOfferShell';

export type PauseSessionGateContentProps = {
  onPendingAfterMutation: () => void | Promise<void>;
  onPendingNavigateAfterAdopt?: (instanceId: string) => void;
  sessionOnPicker: boolean;
  depthPickerSlot: ReactNode;
  scaffoldSlot: ReactNode;
};

/** Children of `PauseSessionGate`: pending offer, then depth picker or active scaffold. */
export function PauseSessionGateContent({
  onPendingAfterMutation,
  onPendingNavigateAfterAdopt,
  sessionOnPicker,
  depthPickerSlot,
  scaffoldSlot,
}: PauseSessionGateContentProps) {
  return (
    <>
      <PendingPauseOfferShell
        onAfterMutation={onPendingAfterMutation}
        navigateAfterAdopt={onPendingNavigateAfterAdopt}
      />
      {sessionOnPicker ? depthPickerSlot : scaffoldSlot}
    </>
  );
}
