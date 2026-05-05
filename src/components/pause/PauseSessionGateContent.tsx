import type { ReactNode } from 'react';

export type PauseSessionGateContentProps = {
  sessionOnPicker: boolean;
  depthPickerSlot: ReactNode;
  scaffoldSlot: ReactNode;
};

/** Children of `PauseSessionGate`: depth picker or active scaffold (`/pause` owns pending-offer UX). */
export function PauseSessionGateContent({ sessionOnPicker, depthPickerSlot, scaffoldSlot }: PauseSessionGateContentProps) {
  return <>{sessionOnPicker ? depthPickerSlot : scaffoldSlot}</>;
}
