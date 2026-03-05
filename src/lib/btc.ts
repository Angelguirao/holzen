export interface BtcPriceData {
  currentPrice: number;
  price24hAgo: number;
  changePercent: number;
  direction: 'up' | 'down';
}

export async function fetchBtcData(): Promise<BtcPriceData> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'
  );
  if (!res.ok) throw new Error('Failed to fetch BTC data');
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
