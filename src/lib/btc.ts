export interface BtcPriceData {
  currentPrice: number;
  price24hAgo: number;
  changePercent: number;
  direction: 'up' | 'down';
  cumulativeChangePercent?: number;
  cumulativeDirection?: 'up' | 'down';
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

export async function fetchBtcData(): Promise<BtcPriceData> {
  // Fetch both 1-day and 7-day data in parallel
  const [res1d, res7d] = await Promise.all([
    fetchWithRetry('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'),
    fetchWithRetry('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7'),
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
    // 7-day data is optional, don't fail
  }

  return {
    currentPrice,
    price24hAgo,
    changePercent,
    direction: changePercent >= 0 ? 'up' : 'down',
    cumulativeChangePercent,
    cumulativeDirection,
  };
}
