import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/posthog';
import { pauseAdoptPendingOffer, pauseDeclinePendingOffer } from '@/features/pause/public-rpc';
import type { PendingPauseOfferRow } from '@/features/pause/public-hooks';

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
  const [leaveSheetBusy, setLeaveSheetBusy] = useState(false);

  const confirmLeavePauseSession = useCallback(() => {
    try {
      trackEvent('pause_session_abandoned', {
        pause_instance_id: pauseInstanceIdForTerminal ?? undefined,
      });
    } catch {
      /* no-op */
    }
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
    if (!pending || leaveSheetBusy) return;
    setLeaveSheetBusy(true);
    try {
      await pauseDeclinePendingOffer();
      try {
        trackEvent('pause_pending_declined', { pause_instance_id: pending.id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(pendingOfferAfterMutation());
      setLeaveWithPendingOpen(false);
      await refreshPendingOffer();
    } catch {
      toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
    } finally {
      setLeaveSheetBusy(false);
    }
  }, [pending, leaveSheetBusy, t, pendingOfferAfterMutation, refreshPendingOffer]);

  const handlePendingAdoptFromLeaveSheet = useCallback(async () => {
    if (!pending || leaveSheetBusy) return;
    setLeaveSheetBusy(true);
    try {
      const r = await pauseAdoptPendingOffer();
      if (!r.ok || !r.instance_id) {
        toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
        return;
      }
      try {
        trackEvent('pause_pending_adopted', { pause_instance_id: r.instance_id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(pendingOfferAfterMutation());
      pendingOfferNavigateAfterAdopt(r.instance_id);
      setLeaveWithPendingOpen(false);
      await refreshPendingOffer();
    } catch {
      toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
    } finally {
      setLeaveSheetBusy(false);
    }
  }, [
    pending,
    leaveSheetBusy,
    t,
    pendingOfferAfterMutation,
    pendingOfferNavigateAfterAdopt,
    refreshPendingOffer,
  ]);

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
