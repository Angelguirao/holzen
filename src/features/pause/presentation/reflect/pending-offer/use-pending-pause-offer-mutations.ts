import { useCallback, useTransition } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '../telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  pauseAdoptPendingOffer,
  pauseDeclinePendingOffer,
} from './pause-reflect-pending-offer-io';
import type { PendingPauseOfferRow } from './use-pending-pause-offer';

export function usePendingPauseOfferMutations(options: {
  pending: PendingPauseOfferRow | null | undefined;
  onAfterMutation: () => void | Promise<void>;
  navigateAfterAdopt?: (target: import('./use-pause-session-pending-pause-offer-navigation').PendingAdoptNavigationTarget) => void;
  refreshPendingOffer: () => Promise<unknown>;
  t: TFunction;
}) {
  const { pending, onAfterMutation, navigateAfterAdopt, refreshPendingOffer, t } = options;
  const [isPending, startTransition] = useTransition();

  const handleAdopt = useCallback((): Promise<boolean> => {
    if (!pending || isPending) return Promise.resolve(false);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const r = await pauseAdoptPendingOffer();
          if (r.status !== 'ok') {
            toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
            resolve(false);
            return;
          }
          trackPausePendingAdopted(r.instanceId);
          await onAfterMutation();
          const pendingContext =
            pending.context_snapshot &&
            typeof pending.context_snapshot.context_text === 'string'
              ? pending.context_snapshot.context_text
              : null;
          navigateAfterAdopt?.({ instanceId: r.instanceId, context: pendingContext });
          await refreshPendingOffer();
          resolve(true);
        } catch {
          toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
          resolve(false);
        }
      });
    });
  }, [pending, isPending, t, onAfterMutation, navigateAfterAdopt, refreshPendingOffer, startTransition]);

  const handleDecline = useCallback((): Promise<boolean> => {
    if (!pending || isPending) return Promise.resolve(false);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const r = await pauseDeclinePendingOffer();
          if (r.status !== 'ok') {
            toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
            resolve(false);
            return;
          }
          trackPausePendingDeclined(pending.id);
          await Promise.resolve(onAfterMutation());
          await refreshPendingOffer();
          resolve(true);
        } catch {
          toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
          resolve(false);
        }
      });
    });
  }, [pending, isPending, t, onAfterMutation, refreshPendingOffer, startTransition]);

  return { busy: isPending, handleAdopt, handleDecline };
}
