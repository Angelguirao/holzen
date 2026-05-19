import type {
  BtcPriceData,
  FearGreedData,
  OnChainData,
} from '@/features/market/domain/market-quote';
import {
  normalizeTrackedAssetId,
  type TrackedAssetId,
} from '@/features/market/domain/tracked-assets';

function marketCacheKey(coinId: string): string {
  return `holzen_market_cache_${coinId}`;
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    console.warn(
      `Market fetch attempt ${i + 1} failed (${res.status}), ${i < retries - 1 ? 'retrying...' : 'giving up'}`,
    );
    await res.text();
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error('Failed to fetch market data after retries');
}

async function fetchFearGreed(): Promise<FearGreedData | undefined> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) return undefined;
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return undefined;
    return {
      value: parseInt(entry.value, 10),
      label: entry.value_classification,
    };
  } catch {
    return undefined;
  }
}

async function fetchOnChainData(): Promise<OnChainData | undefined> {
  try {
    const [mempoolRes, feesRes, hashrateRes, tipRes] = await Promise.all([
      fetch('https://mempool.space/api/mempool')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('https://mempool.space/api/v1/fees/recommended')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('https://mempool.space/api/v1/mining/hashrate/1d')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('https://mempool.space/api/blocks/tip/height')
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null),
    ]);

    const result: OnChainData = {};
    if (mempoolRes) result.mempoolSize = mempoolRes.count;
    if (feesRes) {
      result.fastestFee = feesRes.fastestFee;
      result.medianFee = feesRes.halfHourFee;
    }
    if (hashrateRes?.currentHashrate) {
      const eh = hashrateRes.currentHashrate / 1e18;
      result.hashrate = `${eh.toFixed(1)} EH/s`;
    }
    if (tipRes) result.blockHeight = parseInt(tipRes, 10);
    return result;
  } catch {
    return undefined;
  }
}

interface CachedMarketData {
  data: BtcPriceData;
  timestamp: number;
}

function cacheMarketData(coinId: string, data: BtcPriceData): void {
  try {
    localStorage.setItem(marketCacheKey(coinId), JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* quota exceeded etc */
  }
}

function getCachedMarketData(coinId: string): CachedMarketData | null {
  try {
    const raw = localStorage.getItem(marketCacheKey(coinId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedMarketData;
  } catch {
    return null;
  }
}

const marketFetchInflight = new Map<string, Promise<BtcPriceData>>();

async function fetchMarketDataUncached(coinId: TrackedAssetId, currency: string): Promise<BtcPriceData> {
  const cur = currency.toLowerCase();
  const id = encodeURIComponent(coinId);

  try {
    const includeOnChain = coinId === 'bitcoin';
    const [res1d, res7d, fearGreed, onChain] = await Promise.all([
      fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=1`),
      fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=7`),
      fetchFearGreed(),
      includeOnChain ? fetchOnChainData() : Promise.resolve(undefined),
    ]);

    const data1d = await res1d.json();
    const prices1d: [number, number][] = data1d.prices;
    if (!prices1d || prices1d.length < 2) throw new Error('Insufficient price data');

    const price24hAgo = prices1d[0][1];
    const currentPrice = prices1d[prices1d.length - 1][1];
    const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;

    let cumulativeChangePercent: number | undefined;
    let cumulativeDirection: 'up' | 'down' | undefined;

    try {
      const data7d = await res7d.json();
      const prices7d: [number, number][] = data7d.prices;
      if (prices7d && prices7d.length >= 2) {
        const price7dAgo = prices7d[0][1];
        cumulativeChangePercent = ((currentPrice - price7dAgo) / price7dAgo) * 100;
        cumulativeDirection = cumulativeChangePercent >= 0 ? 'up' : 'down';
      }
    } catch {
      // 7-day data is optional
    }

    const result: BtcPriceData = {
      coinId,
      currentPrice,
      price24hAgo,
      changePercent,
      direction: changePercent >= 0 ? 'up' : 'down',
      cumulativeChangePercent,
      cumulativeDirection,
      fearGreed,
      onChain,
      currency: currency.toUpperCase(),
    };

    cacheMarketData(coinId, result);
    return result;
  } catch (e) {
    const cached = getCachedMarketData(coinId);
    if (cached?.data?.currency?.toUpperCase() === currency.toUpperCase()) {
      console.warn('Using cached market data from', new Date(cached.timestamp).toISOString());
      return { ...cached.data, _stale: true } as BtcPriceData;
    }
    throw e;
  }
}

export async function fetchMarketData(
  coinIdRaw: string | null | undefined,
  currency: string = 'USD',
): Promise<BtcPriceData> {
  const coinId = normalizeTrackedAssetId(coinIdRaw);
  const inflightKey = `${coinId}|${currency.toUpperCase()}`;
  const existing = marketFetchInflight.get(inflightKey);
  if (existing) return existing;
  const p = fetchMarketDataUncached(coinId, currency).finally(() => {
    marketFetchInflight.delete(inflightKey);
  });
  marketFetchInflight.set(inflightKey, p);
  return p;
}

/** @deprecated Prefer fetchMarketData(trackedAssetId, currency) */
export async function fetchBtcData(currency: string = 'USD'): Promise<BtcPriceData> {
  return fetchMarketData('bitcoin', currency);
}
