import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom';
import { usePauseHomeContext } from '@/features/pause/presentation/home/pause-home-context';
import { usePendingPauseOfferMutations } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer-mutations';
import { usePendingPauseOffer } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';

/** Home widget pending-offer adopt/decline (replaces removed app-shell modal). */
export function useHomePendingPauseOfferActions(navigate: NavigateFunction) {
  const { t } = useTranslation();
  const { resyncOpenPauseFromDb } = usePauseHomeContext();
  const { pending, refresh } = usePendingPauseOffer();

  const navigateAfterAdopt = useCallback(
    (instanceId: string) => {
      navigate('/pause', { state: { pauseInstanceId: instanceId } });
    },
    [navigate],
  );

  const { busy, handleAdopt, handleDecline } = usePendingPauseOfferMutations({
    pending,
    onAfterMutation: () => void resyncOpenPauseFromDb(),
    navigateAfterAdopt,
    refreshPendingOffer: refresh,
    t,
  });

  return { pendingOfferBusy: busy, adoptPendingOffer: handleAdopt, declinePendingOffer: handleDecline };
}
