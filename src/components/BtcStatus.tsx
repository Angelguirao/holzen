import { useState } from 'react';
import { Eye, EyeOff, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5" />
          <p className="text-xs font-mono">Unable to fetch price data</p>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/60">
          Check your connection and try again
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
        </div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
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
