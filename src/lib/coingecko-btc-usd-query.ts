/**
 * Lightweight CoinGecko `simple/price` for BTC in USD (e.g. `/reserve` treasury math).
 * Heavier market strips use `fetchMarketData` in `btc.ts`.
 */

export const COINGECKO_BTC_USD_QUERY_KEY = ['external', 'coingecko', 'btc-usd'] as const;

export async function fetchCoingeckoBtcUsd(): Promise<number | null> {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (!r.ok) return null;
    const d = (await r.json()) as { bitcoin?: { usd?: number } };
    return d?.bitcoin?.usd ?? null;
  } catch {
    return null;
  }
}

export function getCoingeckoBtcUsdQueryOptions() {
  return {
    queryKey: COINGECKO_BTC_USD_QUERY_KEY,
    queryFn: fetchCoingeckoBtcUsd,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
