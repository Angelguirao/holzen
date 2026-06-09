import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MarketQuote } from '@/features/market/domain/market-quote';
import { parsePauseCalmSettledAt } from '@/features/pause/domain/pause-open-max-anchor';
import { runPauseApplyCronCalmSweepForSelf } from '@/features/pause/application/use-cases/home/run-pause-apply-cron-calm-sweep-for-self';
import { pendingPauseOfferQueryKey } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';

type Input = {
  userId: string | undefined;
  openPauseInstanceId: string | null;
  openPauseState: 'active' | 'engaged' | null;
  openPauseSource: string | null;
  openPauseMetadata: Record<string, unknown> | null;
  marketData: MarketQuote | null;
  engagedPauseMarketSettled: boolean;
  resyncOpenPauseFromDb: () => void | Promise<void>;
};

/**
 * When Home shows calm-waters on a cron engaged pause without `calm_settled_at`,
 * request a single server calm sweep (debounced per open instance). No polling.
 */
export function useHomeCronCalmSweepOnce(input: Input): void {
  const queryClient = useQueryClient();
  const attemptedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const {
      userId,
      openPauseInstanceId,
      openPauseState,
      openPauseSource,
      openPauseMetadata,
      marketData,
      engagedPauseMarketSettled,
    } = input;

    if (!userId || !openPauseInstanceId) return;
    if (openPauseState !== 'engaged' || openPauseSource !== 'cron_volatility') return;
    if (!engagedPauseMarketSettled || !marketData) return;
    if (parsePauseCalmSettledAt(openPauseMetadata)) return;

    const attemptKey = `${openPauseInstanceId}:calm-sweep`;
    if (attemptedKeyRef.current === attemptKey) return;
    attemptedKeyRef.current = attemptKey;

    let cancelled = false;

    void runPauseApplyCronCalmSweepForSelf({
      changePercent: marketData.changePercent,
      direction: marketData.direction,
    })
      .then((result) => {
        if (cancelled || !result.applied) return;
        void input.resyncOpenPauseFromDb();
        void queryClient.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
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
    input.openPauseSource,
    input.openPauseMetadata,
    input.marketData,
    input.engagedPauseMarketSettled,
    queryClient,
  ]);
}
