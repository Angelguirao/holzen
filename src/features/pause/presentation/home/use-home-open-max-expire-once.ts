import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isPauseOpenMaxExpired } from '@/features/pause/domain/pause-open-max-anchor';
import { pauseEvaluateTransitionsForInstance } from '@/features/pause/presentation/home/pause-home-cron-io';
import { pendingPauseOfferQueryKey } from '@/features/pause/public-queries';

type Input = {
  userId: string | undefined;
  openPauseInstanceId: string | null;
  openPauseState: 'active' | 'engaged' | null;
  openPauseSource: string | null;
  openPauseEngagedAt: string | null;
  openPauseCreatedAt: string | null;
  openPauseMetadata: Record<string, unknown> | null;
  openPauseOpenMaxAnchorAt: string | null;
  resyncOpenPauseFromDb: () => void | Promise<void>;
};

/**
 * When the engaged open-max countdown reaches zero, hide Continue via projection and
 * request a single `pause_evaluate_transitions` (cron sweep may not have run yet).
 */
export function useHomeOpenMaxExpireOnce(input: Input): { openPauseOpenMaxExpired: boolean } {
  const queryClient = useQueryClient();
  const attemptedKeyRef = useRef<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!input.openPauseOpenMaxAnchorAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [input.openPauseOpenMaxAnchorAt]);

  const openPauseOpenMaxExpired = useMemo(() => {
    if (input.openPauseState !== 'engaged' || !input.openPauseCreatedAt) return false;
    if (!input.openPauseOpenMaxAnchorAt) return false;
    return isPauseOpenMaxExpired(
      {
        state: 'engaged',
        source: input.openPauseSource,
        engaged_at: input.openPauseEngagedAt,
        created_at: input.openPauseCreatedAt,
        metadata: input.openPauseMetadata,
      },
      nowMs,
    );
  }, [
    input.openPauseState,
    input.openPauseCreatedAt,
    input.openPauseOpenMaxAnchorAt,
    input.openPauseSource,
    input.openPauseEngagedAt,
    input.openPauseMetadata,
    nowMs,
  ]);

  useEffect(() => {
    if (!input.userId || !input.openPauseInstanceId || !input.openPauseOpenMaxAnchorAt) return;
    if (input.openPauseState !== 'engaged' || !openPauseOpenMaxExpired) return;

    const attemptKey = `${input.openPauseInstanceId}:open-max-expire`;
    if (attemptedKeyRef.current === attemptKey) return;
    attemptedKeyRef.current = attemptKey;

    let cancelled = false;

    void pauseEvaluateTransitionsForInstance(input.openPauseInstanceId)
      .then((state) => {
        if (cancelled) return;
        if (state === 'expired') {
          void input.resyncOpenPauseFromDb();
          void queryClient.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(input.userId!) });
          return;
        }
        attemptedKeyRef.current = null;
      })
      .catch(() => {
        if (!cancelled) attemptedKeyRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [
    input.userId,
    input.openPauseInstanceId,
    input.openPauseState,
    input.openPauseOpenMaxAnchorAt,
    input.resyncOpenPauseFromDb,
    openPauseOpenMaxExpired,
    queryClient,
  ]);

  return { openPauseOpenMaxExpired };
}
