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
  const res = await fetchWithRetry(
    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'
  );
  const data = await res.json();
  const prices: [number, number][] = data.prices;
  if (!prices || prices.length < 2) throw new Error('Insufficient price data');

  const price24hAgo = prices[0][1];
  const currentPrice = prices[prices.length - 1][1];
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;

  return {
    currentPrice,
    price24hAgo,
    changePercent,
    direction: changePercent >= 0 ? 'up' : 'down',
  };
}
