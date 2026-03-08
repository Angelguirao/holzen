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
}

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

export async function fetchBtcData(): Promise<BtcPriceData> {
  // Fetch price data and fear/greed in parallel
  const [res1d, res7d, fearGreed] = await Promise.all([
    fetchWithRetry('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'),
    fetchWithRetry('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7'),
    fetchFearGreed(),
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

  return {
    currentPrice,
    price24hAgo,
    changePercent,
    direction: changePercent >= 0 ? 'up' : 'down',
    cumulativeChangePercent,
    cumulativeDirection,
    fearGreed,
  };
}
