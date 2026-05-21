import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '@/features/pause/application/use-cases/trigger/pending-pause-offer-telemetry';
import {
  adoptPendingPauseOffer,
  declinePendingPauseOffer,
} from '@/features/pause/public-rpc';
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
      const r = await adoptPendingPauseOffer();
      if (r.status !== 'ok') {
        toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
        return false;
      }
      trackPausePendingAdopted(r.instanceId);
      await Promise.resolve(onAfterMutation());
      navigateAfterAdopt?.(r.instanceId);
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
      const r = await declinePendingPauseOffer();
      if (r.status !== 'ok') {
        toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
        return false;
      }
      trackPausePendingDeclined(pending.id);
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
