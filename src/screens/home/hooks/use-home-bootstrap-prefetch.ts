import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invokeHomeBootstrap } from '@/features/market/infrastructure/edge/home-bootstrap-edge';
import { mapMarketQuotePayload } from '@/features/market/infrastructure/edge/map-market-quote-payload';
import { holzenMarketDisplayQueryKey } from '@/features/market/application/queries/holzen-market-display-keys';
import { HOLZEN_NUMBER_QUERY_KEY } from '@/features/user/infrastructure/queries/holzen-number-query';

/**
 * Seeds Holzen Number + market display caches in one edge round-trip on Home mount.
 * Downstream `useQuery` hooks read warm cache instead of firing separate fetches.
 */
export function useHomeBootstrapPrefetch(params: {
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

    void (async () => {
      const { data, error } = await invokeHomeBootstrap({
        coinId: coinIdRaw ?? 'bitcoin',
        currency,
      });
      if (error || !data) return;

      if (data.holzenNumber) {
        queryClient.setQueryData(HOLZEN_NUMBER_QUERY_KEY, data.holzenNumber);
      }
      if (data.market) {
        queryClient.setQueryData(
          holzenMarketDisplayQueryKey(coinIdRaw, currency),
          mapMarketQuotePayload(data.market),
        );
      }
    })();
  }, [userId, coinIdRaw, currency, queryClient]);
}
