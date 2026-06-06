/**
 * Server-side market quote fetch + short TTL cache (CoinGecko + Fear & Greed).
 * Used by `market-quote` edge — keeps browser off public APIs.
 */
import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";
import { coingeckoHeaders } from "./coingecko.ts";
import { isBitcoinTrackedAsset } from "./tracked-assets.ts";

export type MarketQuoteMode = "lite" | "full";

export type MarketQuotePayload = {
  coinId: string;
  currentPrice: number;
  price24hAgo: number;
  changePercent: number;
  direction: "up" | "down";
  cumulativeChangePercent?: number;
  cumulativeDirection?: "up" | "down";
  fearGreed?: { value: number; label: string };
  onChain?: Record<string, unknown>;
  currency: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expires: number; data: MarketQuotePayload }>();

function cacheKey(coinId: string, currency: string, mode: MarketQuoteMode): string {
  return `${coinId}|${currency.toUpperCase()}|${mode}`;
}

async function fetchWithRetry(
  incoming: Request | undefined,
  url: string,
  retries = 3,
  delayMs = 2000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, fetchInitWithIncomingTrace(incoming, { headers: coingeckoHeaders() }));
    if (res.ok) return res;
    await res.text().catch(() => undefined);
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch market data after retries");
}

async function fetchFearGreed(incoming?: Request): Promise<{ value: number; label: string } | undefined> {
  try {
    const res = await fetch(
      "https://api.alternative.me/fng/?limit=1",
      fetchInitWithIncomingTrace(incoming),
    );
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

async function fetchOnChainData(incoming?: Request): Promise<Record<string, unknown> | undefined> {
  try {
    const [mempoolRes, feesRes, hashrateRes, tipRes] = await Promise.all([
      fetch("https://mempool.space/api/mempool", fetchInitWithIncomingTrace(incoming))
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("https://mempool.space/api/v1/fees/recommended", fetchInitWithIncomingTrace(incoming))
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("https://mempool.space/api/v1/mining/hashrate/1d", fetchInitWithIncomingTrace(incoming))
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("https://mempool.space/api/blocks/tip/height", fetchInitWithIncomingTrace(incoming))
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null),
    ]);
    const result: Record<string, unknown> = {};
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
    return Object.keys(result).length ? result : undefined;
  } catch {
    return undefined;
  }
}

function parse24h(prices1d: [number, number][]) {
  if (!prices1d || prices1d.length < 2) throw new Error("Insufficient price data");
  const price24hAgo = prices1d[0][1];
  const currentPrice = prices1d[prices1d.length - 1][1];
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;
  return {
    currentPrice,
    price24hAgo,
    changePercent,
    direction: changePercent >= 0 ? ("up" as const) : ("down" as const),
  };
}

/** Cached market quote for Home display (`lite`) or manual pause (`full`). */
export async function fetchMarketQuoteCached(
  coinIdRaw: string,
  currencyRaw: string,
  mode: MarketQuoteMode,
  incoming?: Request,
): Promise<MarketQuotePayload> {
  const coinId = coinIdRaw?.trim() || "bitcoin";
  const currency = (currencyRaw?.trim() || "USD").toUpperCase();
  const key = cacheKey(coinId, currency, mode);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  const cur = currency.toLowerCase();
  const id = encodeURIComponent(coinId);

  const res1d = await fetchWithRetry(
    incoming,
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=1`,
  );
  const fearGreed = await fetchFearGreed(incoming);
  const data1d = await res1d.json();
  const quote = parse24h(data1d.prices as [number, number][]);

  let onChain: Record<string, unknown> | undefined;
  if (mode === "full" && isBitcoinTrackedAsset(coinId)) {
    onChain = await fetchOnChainData(incoming);
  }

  const payload: MarketQuotePayload = {
    coinId,
    ...quote,
    fearGreed,
    onChain,
    currency,
  };

  cache.set(key, { data: payload, expires: Date.now() + CACHE_TTL_MS });
  return payload;
}
