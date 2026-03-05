import type { BtcPriceData } from '@/lib/btc';

interface Props {
  data: BtcPriceData | null;
  error: string | null;
}

export function BtcStatus({ data, error }: Props) {
  if (error) {
    return (
      <p className="text-xs font-mono text-muted-foreground">
        Unable to fetch price data
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-xs font-mono text-muted-foreground">
        Loading price data
      </p>
    );
  }

  const dir = data.direction === 'down' ? '−' : '+';
  const pct = Math.abs(data.changePercent).toFixed(1);
  const price = data.currentPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-1">
      <p className="text-xs font-mono text-muted-foreground">BTC / USD</p>
      <p className="text-2xl font-mono tracking-tight">{price}</p>
      <p className="text-sm font-mono text-muted-foreground">
        {dir}{pct}% in 24h
      </p>
    </div>
  );
}
