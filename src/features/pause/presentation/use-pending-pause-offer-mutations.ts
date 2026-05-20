import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/posthog';
import { pauseAdoptPendingOffer, pauseDeclinePendingOffer } from '@/features/pause/public-rpc';
import type { PendingPauseOfferRow } from './use-pending-pause-offer';

export function usePendingPauseOfferMutations(options: {
  pending: PendingPauseOfferRow | null | undefined;
  onAfterMutation: () => void | Promise<void>;
  navigateAfterAdopt?: (instanceId: string) => void;
  refreshPendingOffer: () => Promise<unknown>;
  t: TFunction;
}) {
  const { pending, onAfterMutation, navigateAfterAdopt, refreshPendingOffer, t } = options;
  const [busy, setBusy] = useState(false);

  const handleAdopt = useCallback(async (): Promise<boolean> => {
    if (!pending || busy) return false;
    setBusy(true);
    try {
      const r = await pauseAdoptPendingOffer();
      if (!r.ok || !r.instance_id) {
        toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
        return false;
      }
      try {
        trackEvent('pause_pending_adopted', { pause_instance_id: r.instance_id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(onAfterMutation());
      navigateAfterAdopt?.(r.instance_id);
      await refreshPendingOffer();
      return true;
    } catch {
      toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
      return false;
    } finally {
      setBusy(false);
    }
  }, [pending, busy, t, onAfterMutation, navigateAfterAdopt, refreshPendingOffer]);

  const handleDecline = useCallback(async (): Promise<boolean> => {
    if (!pending || busy) return false;
    setBusy(true);
    try {
      await pauseDeclinePendingOffer();
      try {
        trackEvent('pause_pending_declined', { pause_instance_id: pending.id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(onAfterMutation());
      await refreshPendingOffer();
      return true;
    } catch {
      toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
      return false;
    } finally {
      setBusy(false);
    }
  }, [pending, busy, t, onAfterMutation, refreshPendingOffer]);

  return { busy, handleAdopt, handleDecline };
}
