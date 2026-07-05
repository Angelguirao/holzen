import type {
  FearGreedData,
  MarketQuote,
  OnChainData,
} from '@/features/market/domain/market-quote';
import {
  isBitcoinTrackedAsset,
  normalizeTrackedAssetId,
  type TrackedAssetId,
} from '@/features/market/domain/tracked-assets';
import { invokeMarketQuote } from '@/features/market/infrastructure/edge/market-quote-edge';
import { mapMarketQuotePayload } from '@/features/market/infrastructure/edge/map-market-quote-payload';

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
  data: MarketQuote;
  timestamp: number;
}

function cacheMarketData(coinId: string, data: MarketQuote): void {
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

function readCachedMarketQuote(
  coinId: TrackedAssetId,
  currency: string,
): MarketQuote | null {
  const cached = getCachedMarketData(coinId);
  if (cached?.data?.currency?.toUpperCase() === currency.toUpperCase()) {
    console.warn('Using cached market data from', new Date(cached.timestamp).toISOString());
    return { ...cached.data, _stale: true } as MarketQuote;
  }
  return null;
}

function parse24hQuoteFromChart(
  prices1d: [number, number][],
): Pick<MarketQuote, 'currentPrice' | 'price24hAgo' | 'changePercent' | 'direction'> {
  if (!prices1d || prices1d.length < 2) throw new Error('Insufficient price data');
  const price24hAgo = prices1d[0][1];
  const currentPrice = prices1d[prices1d.length - 1][1];
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;
  return {
    currentPrice,
    price24hAgo,
    changePercent,
    direction: changePercent >= 0 ? 'up' : 'down',
  };
}

const marketFetchInflight = new Map<string, Promise<MarketQuote>>();

function dedupeMarketFetch(inflightKey: string, run: () => Promise<MarketQuote>): Promise<MarketQuote> {
  const existing = marketFetchInflight.get(inflightKey);
  if (existing) return existing;
  const p = run().finally(() => {
    marketFetchInflight.delete(inflightKey);
  });
  marketFetchInflight.set(inflightKey, p);
  return p;
}

async function tryFetchMarketFromEdge(
  coinId: TrackedAssetId,
  currency: string,
  mode: 'lite' | 'full',
): Promise<MarketQuote | null> {
  try {
    const { data, error } = await invokeMarketQuote({ coinId, currency, mode });
    if (error || !data) return null;
    const mapped = mapMarketQuotePayload(data);
    cacheMarketData(coinId, mapped);
    return mapped;
  } catch {
    return null;
  }
}

/**
 * Home market strip: 24h quote + Fear & Greed only (2 external calls).
 * Full enrichment (on-chain) runs on manual pause trigger.
 */
async function fetchMarketDataLiteUncached(
  coinId: TrackedAssetId,
  currency: string,
): Promise<MarketQuote> {
  const fromEdge = await tryFetchMarketFromEdge(coinId, currency, 'lite');
  if (fromEdge) return fromEdge;

  const cur = currency.toLowerCase();
  const id = encodeURIComponent(coinId);

  try {
    const [res1d, fearGreed] = await Promise.all([
      fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=1`),
      fetchFearGreed(),
    ]);

    const data1d = await res1d.json();
    const quote = parse24hQuoteFromChart(data1d.prices as [number, number][]);

    const result: MarketQuote = {
      coinId,
      ...quote,
      fearGreed,
      currency: currency.toUpperCase(),
    };

    cacheMarketData(coinId, result);
    return result;
  } catch (e) {
    const cached = readCachedMarketQuote(coinId, currency);
    if (cached) return cached;
    throw e;
  }
}

async function fetchMarketDataUncached(coinId: TrackedAssetId, currency: string): Promise<MarketQuote> {
  const fromEdge = await tryFetchMarketFromEdge(coinId, currency, 'full');
  if (fromEdge) return fromEdge;

  const cur = currency.toLowerCase();
  const id = encodeURIComponent(coinId);

  try {
    const includeOnChain = isBitcoinTrackedAsset(coinId);
    const [res1d, fearGreed, onChain] = await Promise.all([
      fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=1`),
      fetchFearGreed(),
      includeOnChain ? fetchOnChainData() : Promise.resolve(undefined),
    ]);

    const data1d = await res1d.json();
    const quote = parse24hQuoteFromChart(data1d.prices as [number, number][]);

    const result: MarketQuote = {
      coinId,
      ...quote,
      fearGreed,
      onChain,
      currency: currency.toUpperCase(),
    };

    cacheMarketData(coinId, result);
    return result;
  } catch (e) {
    const cached = readCachedMarketQuote(coinId, currency);
    if (cached) return cached;
    throw e;
  }
}

export async function fetchMarketDataLite(
  coinIdRaw: string | null | undefined,
  currency: string = 'USD',
): Promise<MarketQuote> {
  const coinId = normalizeTrackedAssetId(coinIdRaw);
  const inflightKey = `${coinId}|${currency.toUpperCase()}|lite`;
  return dedupeMarketFetch(inflightKey, () => fetchMarketDataLiteUncached(coinId, currency));
}

/** Full quote for manual pause context (optional on-chain enrichment). */
export async function fetchMarketData(
  coinIdRaw: string | null | undefined,
  currency: string = 'USD',
): Promise<MarketQuote> {
  const coinId = normalizeTrackedAssetId(coinIdRaw);
  const inflightKey = `${coinId}|${currency.toUpperCase()}|full`;
  return dedupeMarketFetch(inflightKey, () => fetchMarketDataUncached(coinId, currency));
}

/** @deprecated Prefer fetchMarketData(trackedAssetId, currency) */
export async function fetchBtcData(currency: string = 'USD'): Promise<MarketQuote> {
  return fetchMarketData('bitcoin', currency);
}
