import { useEffect, useMemo, useState } from 'react';
import { usePauseHomeContext } from '@/features/pause/presentation/home/pause-home-context';
import { resolveHomePauseWidgetOpenMaxAnchorAt } from '@/features/pause/domain/home/resolve-home-pause-widget-open-max-anchor';
import { isPauseOpenMaxExpired } from '@/features/pause/domain/pause-open-max-anchor';
import { usePendingPauseOffer } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';
import type { OpenPauseNotificationContext } from '@/features/notifications/domain/resolve-pause-notification-inbox-presentation';

/** Live open-pause snapshot for inbox row CTAs (matches Home widget open-max semantics). */
export function useOpenPauseNotificationContext(): OpenPauseNotificationContext {
  const {
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    openPauseEngagedAt,
    openPauseCreatedAt,
    openPauseMetadata,
  } = usePauseHomeContext();
  const { pending } = usePendingPauseOffer();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const openPauseOpenMaxAnchorAt = useMemo(
    () =>
      resolveHomePauseWidgetOpenMaxAnchorAt({
        openPauseState,
        openPauseSource,
        openPauseEngagedAt,
        openPauseCreatedAt,
        openPauseMetadata,
      }),
    [openPauseState, openPauseSource, openPauseEngagedAt, openPauseCreatedAt, openPauseMetadata],
  );

  useEffect(() => {
    if (openPauseState !== 'engaged' || !openPauseOpenMaxAnchorAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [openPauseOpenMaxAnchorAt, openPauseState]);

  const openMaxExpired = useMemo(() => {
    if (openPauseState !== 'engaged' || !openPauseCreatedAt || !openPauseOpenMaxAnchorAt) return false;
    return isPauseOpenMaxExpired(
      {
        state: 'engaged',
        source: openPauseSource,
        engaged_at: openPauseEngagedAt,
        created_at: openPauseCreatedAt,
        metadata: openPauseMetadata,
      },
      nowMs,
    );
  }, [
    openPauseState,
    openPauseCreatedAt,
    openPauseOpenMaxAnchorAt,
    openPauseSource,
    openPauseEngagedAt,
    openPauseMetadata,
    nowMs,
  ]);

  return useMemo(
    () => ({
      instanceId: lastPauseInstanceId,
      state: openPauseState,
      openMaxExpired,
      pendingOfferInstanceId: pending?.id ?? null,
    }),
    [lastPauseInstanceId, openPauseState, openMaxExpired, pending?.id],
  );
}
