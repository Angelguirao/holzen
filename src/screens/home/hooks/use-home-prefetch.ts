import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { holzenMarketDisplayQueryKey } from '@/features/market/application/queries/holzen-market-display-keys';
import { invokeMarketQuote } from '@/features/market/infrastructure/edge/market-quote-edge';
import { mapMarketQuotePayload } from '@/features/market/infrastructure/edge/map-market-quote-payload';
import {
  fetchHolzenNumber,
  HOLZEN_NUMBER_QUERY_KEY,
} from '@/features/user/infrastructure/queries/holzen-number-query';

/**
 * Seeds market display + community stats caches on Home mount (parallel edges).
 * Downstream `useQuery` hooks read warm cache instead of duplicate fetches.
 */
export function useHomePrefetch(params: {
  userId: string | undefined;
  coinIdRaw: string | null | undefined;
  currency: string;
}) {
  const { userId, coinIdRaw, currency } = params;
  const queryClient = useQueryClient();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!userId || startedRef.current) return;
    startedRef.current = true;

    const coinId = coinIdRaw ?? 'bitcoin';

    void (async () => {
      const [marketResult, holzenNumber] = await Promise.all([
        invokeMarketQuote({ coinId, currency, mode: 'lite' }),
        fetchHolzenNumber(),
      ]);

      if (holzenNumber) {
        queryClient.setQueryData(HOLZEN_NUMBER_QUERY_KEY, holzenNumber);
      }
      if (marketResult.data) {
        queryClient.setQueryData(
          holzenMarketDisplayQueryKey(coinIdRaw, currency),
          mapMarketQuotePayload(marketResult.data),
        );
      }
    })();
  }, [userId, coinIdRaw, currency, queryClient]);
}
