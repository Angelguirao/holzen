export interface FearGreedData {
  value: number;
  label: string;
}

export interface OnChainData {
  mempoolSize?: number; // number of unconfirmed txs
  fastestFee?: number; // sat/vB
  medianFee?: number;
  hashrate?: string; // human-readable
  blockHeight?: number;
}

export interface BtcPriceData {
  currentPrice: number;
  price24hAgo: number;
  changePercent: number;
  direction: 'up' | 'down';
  cumulativeChangePercent?: number;
  cumulativeDirection?: 'up' | 'down';
  fearGreed?: FearGreedData;
  onChain?: OnChainData;
  currency: string;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won' },
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]['code'];

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    console.warn(`BTC fetch attempt ${i + 1} failed (${res.status}), ${i < retries - 1 ? 'retrying...' : 'giving up'}`);
    await res.text();
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error('Failed to fetch BTC data after retries');
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
      fetch('https://mempool.space/api/mempool').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('https://mempool.space/api/v1/fees/recommended').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('https://mempool.space/api/v1/mining/hashrate/1d').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('https://mempool.space/api/blocks/tip/height').then((r) => (r.ok ? r.text() : null)).catch(() => null),
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

const BTC_CACHE_KEY = 'holzen_btc_cache';

interface CachedBtcData {
  data: BtcPriceData;
  timestamp: number;
}

function cacheBtcData(data: BtcPriceData): void {
  try {
    localStorage.setItem(BTC_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* quota exceeded etc */ }
}

export function getCachedBtcData(): CachedBtcData | null {
  try {
    const raw = localStorage.getItem(BTC_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedBtcData;
  } catch {
    return null;
  }
}

export function formatBtcPrice(price: number, currency: string): string {
  const fractionDigits = currency === 'JPY' || currency === 'KRW' ? 0 : 0;
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
  });
}

export async function fetchBtcData(currency: string = 'USD'): Promise<BtcPriceData> {
  const cur = currency.toLowerCase();

  try {
    const [res1d, res7d, fearGreed, onChain] = await Promise.all([
      fetchWithRetry(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=1`),
      fetchWithRetry(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=7`),
      fetchFearGreed(),
      fetchOnChainData(),
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

    cacheBtcData(result);
    return result;
  } catch (e) {
    // Fallback to cached data if available
    const cached = getCachedBtcData();
    if (cached) {
      console.warn('Using cached BTC data from', new Date(cached.timestamp).toISOString());
      return { ...cached.data, _stale: true } as BtcPriceData;
    }
    throw e;
  }
}
