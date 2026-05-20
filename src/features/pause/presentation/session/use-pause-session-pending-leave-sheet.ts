import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import { trackPauseSessionAbandoned } from '@/features/pause/application/use-cases/session/pause-session-telemetry';
import type { PendingPauseOfferRow } from './use-pending-pause-offer';
import { usePendingPauseOfferMutations } from './use-pending-pause-offer-mutations';

export function usePauseSessionPendingLeaveSheet(options: {
  pending: PendingPauseOfferRow | null | undefined;
  pauseInstanceIdForTerminal: string | null | undefined;
  handleClose: () => void;
  pendingOfferAfterMutation: () => void | Promise<void>;
  pendingOfferNavigateAfterAdopt: (instanceId: string) => void;
  refreshPendingOffer: () => Promise<unknown>;
  t: TFunction;
}) {
  const {
    pending,
    pauseInstanceIdForTerminal,
    handleClose,
    pendingOfferAfterMutation,
    pendingOfferNavigateAfterAdopt,
    refreshPendingOffer,
    t,
  } = options;

  const [leaveWithPendingOpen, setLeaveWithPendingOpen] = useState(false);

  const { busy: leaveSheetBusy, handleAdopt, handleDecline } = usePendingPauseOfferMutations({
    pending,
    onAfterMutation: pendingOfferAfterMutation,
    navigateAfterAdopt: pendingOfferNavigateAfterAdopt,
    refreshPendingOffer,
    t,
  });

  const confirmLeavePauseSession = useCallback(() => {
    trackPauseSessionAbandoned(pauseInstanceIdForTerminal ?? undefined);
    setLeaveWithPendingOpen(false);
    handleClose();
  }, [handleClose, pauseInstanceIdForTerminal]);

  const requestExitPauseBeforeDone = useCallback(() => {
    if (pending) {
      setLeaveWithPendingOpen(true);
      return;
    }
    confirmLeavePauseSession();
  }, [pending, confirmLeavePauseSession]);

  const handleDeclinePendingFromLeaveSheet = useCallback(async () => {
    const ok = await handleDecline();
    if (ok) setLeaveWithPendingOpen(false);
  }, [handleDecline]);

  const handlePendingAdoptFromLeaveSheet = useCallback(async () => {
    const ok = await handleAdopt();
    if (ok) setLeaveWithPendingOpen(false);
  }, [handleAdopt]);

  return {
    leaveWithPendingOpen,
    setLeaveWithPendingOpen,
    leaveSheetBusy,
    confirmLeavePauseSession,
    requestExitPauseBeforeDone,
    handleDeclinePendingFromLeaveSheet,
    handlePendingAdoptFromLeaveSheet,
  };
}
