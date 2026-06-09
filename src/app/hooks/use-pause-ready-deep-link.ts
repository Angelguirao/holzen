import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useProfile } from '@/features/user/public-hooks';
import { buildHomePauseSessionLocationState } from '@/features/pause/public-navigation';
import { usePauseHomeContext } from '@/features/pause/presentation/home/pause-home-context';
import { resolveHomePauseWidgetOpenMaxAnchorAt } from '@/features/pause/domain/home/resolve-home-pause-widget-open-max-anchor';
import { isPauseOpenMaxExpired } from '@/features/pause/domain/pause-open-max-anchor';

type Input = {
  navigate: NavigateFunction;
  setPauseReadyBanner: (visible: boolean) => void;
};

function consumePauseReadyQueryParams(): { pauseInstanceId: string | null; bannerOnly: boolean } {
  const params = new URLSearchParams(window.location.search);
  if (params.get('pause') !== 'ready') {
    return { pauseInstanceId: null, bannerOnly: false };
  }

  const pauseInstanceId = params.get('pauseInstanceId')?.trim() || null;

  const url = new URL(window.location.href);
  url.searchParams.delete('pause');
  url.searchParams.delete('pauseInstanceId');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);

  return { pauseInstanceId, bannerOnly: !pauseInstanceId };
}

/**
 * Web push + SW deep links: `/?pause=ready&pauseInstanceId=…` or `holzen:pause-ready` postMessage.
 */
export function usePauseReadyDeepLink({ navigate, setPauseReadyBanner }: Input): void {
  const { companionPrefs } = useProfile();
  const {
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    openPauseEngagedAt,
    openPauseCreatedAt,
    openPauseMetadata,
    message,
    context,
    companions,
    severity,
    loading,
  } = usePauseHomeContext();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const pendingDeepLinkRef = useRef<string | null | undefined>(undefined);

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
    if (!openPauseOpenMaxAnchorAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [openPauseOpenMaxAnchorAt]);

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

  const tryNavigateToOpenPause = useCallback(
    (requestedInstanceId: string | null) => {
      if (loading) {
        pendingDeepLinkRef.current = requestedInstanceId;
        return;
      }

      pendingDeepLinkRef.current = undefined;

      if (!lastPauseInstanceId || !openPauseState || openMaxExpired) {
        setPauseReadyBanner(false);
        return;
      }

      if (requestedInstanceId && requestedInstanceId !== lastPauseInstanceId) {
        setPauseReadyBanner(false);
        return;
      }

      setPauseReadyBanner(false);
      navigate('/pause', {
        state: buildHomePauseSessionLocationState({
          message,
          context,
          pauseInstanceId: lastPauseInstanceId,
          companions,
          companionPrefs,
          severity,
        }),
      });
    },
    [
      loading,
      lastPauseInstanceId,
      openPauseState,
      openMaxExpired,
      setPauseReadyBanner,
      navigate,
      message,
      context,
      companions,
      companionPrefs,
      severity,
    ],
  );

  useEffect(() => {
    const { pauseInstanceId, bannerOnly } = consumePauseReadyQueryParams();
    if (bannerOnly) {
      setPauseReadyBanner(true);
      pendingDeepLinkRef.current = undefined;
      return;
    }
    if (pauseInstanceId) {
      pendingDeepLinkRef.current = pauseInstanceId;
    }
  }, [setPauseReadyBanner]);

  useEffect(() => {
    if (pendingDeepLinkRef.current === undefined) return;
    if (loading) return;
    tryNavigateToOpenPause(pendingDeepLinkRef.current);
  }, [loading, tryNavigateToOpenPause]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; pauseInstanceId?: string | null } | null;
      if (data?.type !== 'holzen:pause-ready') return;
      tryNavigateToOpenPause(data.pauseInstanceId ?? null);
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [tryNavigateToOpenPause]);
}
