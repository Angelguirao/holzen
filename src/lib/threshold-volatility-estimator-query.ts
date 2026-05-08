function volatilityCacheKey(coinId: string): string {
  return `holzen_volatility_stats_v2_${coinId}`;
}

const LEGACY_CACHE_KEY = 'holzen_btc_volatility_stats';

export const THRESHOLD_VOLATILITY_ESTIMATOR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export interface ThresholdVolatilityCachedPayload {
  dailyChanges: number[];
  hourlyPrices: [number, number][];
  timestamp: number;
}

export const THRESHOLD_VOLATILITY_ESTIMATOR_QUERY_PREFIX = [
  'external',
  'coingecko',
  'volatility_estimator',
] as const;

export function thresholdVolatilityEstimatorQueryKey(coinId: string) {
  return [...THRESHOLD_VOLATILITY_ESTIMATOR_QUERY_PREFIX, coinId] as const;
}

function isValidCachedData(value: unknown): value is ThresholdVolatilityCachedPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.timestamp !== 'number') return false;
  if (!Array.isArray(v.dailyChanges) || !Array.isArray(v.hourlyPrices)) return false;

  const hasValidDaily = v.dailyChanges.every((n) => typeof n === 'number');
  const hasValidHourly = v.hourlyPrices.every(
    (entry) => Array.isArray(entry) && entry.length === 2 && entry.every((n) => typeof n === 'number'),
  );

  return hasValidDaily && hasValidHourly;
}

export async function fetchThresholdVolatilityEstimatorData(
  coinId: string,
): Promise<ThresholdVolatilityCachedPayload | null> {
  const key = volatilityCacheKey(coinId);
  try {
    const readCached = (k: string): ThresholdVolatilityCachedPayload | null => {
      const cached = localStorage.getItem(k);
      if (!cached) return null;
      const parsed: unknown = JSON.parse(cached);
      if (!isValidCachedData(parsed)) return null;
      if (Date.now() - parsed.timestamp >= THRESHOLD_VOLATILITY_ESTIMATOR_CACHE_TTL_MS) return null;
      return parsed;
    };

    let cached = readCached(key);
    if (!cached && coinId === 'bitcoin') {
      cached = readCached(LEGACY_CACHE_KEY) ?? readCached('holzen_btc_volatility_stats_v2');
    }
    if (cached) {
      localStorage.setItem(key, JSON.stringify(cached));
      if (coinId === 'bitcoin') {
        localStorage.removeItem(LEGACY_CACHE_KEY);
        localStorage.removeItem('holzen_btc_volatility_stats_v2');
      }
      return cached;
    }

    const id = encodeURIComponent(coinId);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=90`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const prices: [number, number][] = data.prices;
    if (!prices || prices.length < 2) return null;

    const dailyChanges: number[] = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    let lastPrice = prices[0][1];
    let lastTime = prices[0][0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i][0] - lastTime >= msPerDay * 0.8) {
        const change = Math.abs(((prices[i][1] - lastPrice) / lastPrice) * 100);
        dailyChanges.push(change);
        lastPrice = prices[i][1];
        lastTime = prices[i][0];
      }
    }

    const result: ThresholdVolatilityCachedPayload = {
      dailyChanges,
      hourlyPrices: prices,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

export function getThresholdVolatilityEstimatorQueryOptions(coinId: string) {
  const ttl = THRESHOLD_VOLATILITY_ESTIMATOR_CACHE_TTL_MS;
  return {
    queryKey: thresholdVolatilityEstimatorQueryKey(coinId),
    queryFn: () => fetchThresholdVolatilityEstimatorData(coinId),
    staleTime: ttl,
    gcTime: ttl * 2,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
