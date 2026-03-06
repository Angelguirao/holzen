import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { BtcPriceData } from '@/lib/btc';

interface Props {
  data: BtcPriceData | null;
  error: string | null;
}

export function BtcStatus({ data, error }: Props) {
  const [hidden, setHidden] = useState(() => localStorage.getItem('holzen_hide_price') === 'true');

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem('holzen_hide_price', String(next));
  };

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
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground">BTC / USD</p>
        <button
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={hidden ? 'Show price' : 'Hide price'}
        >
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {hidden ? (
        <>
          <p className="text-2xl font-mono tracking-tight text-muted-foreground/30">••••••</p>
          <p className="text-sm font-mono text-muted-foreground/30">••••</p>
        </>
      ) : (
        <>
          <p className="text-2xl font-mono tracking-tight">{price}</p>
          <p className="text-sm font-mono text-muted-foreground">
            {dir}{pct}% in 24h
          </p>
        </>
      )}
    </div>
  );
}
