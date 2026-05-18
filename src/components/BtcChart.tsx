import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatBtcPrice } from '@/features/market/public';
import {
  getCoingeckoMarketChartQueryOptions,
  type CoingeckoMarketChartPoint,
} from '@/features/market/public';
import { ErrorRetry } from '@/components/ErrorRetry';

interface Props {
  hidden?: boolean;
  currency?: string;
  /** CoinGecko coin id */
  coinId?: string;
}

export function BtcChart({ hidden = false, currency = 'USD', coinId = 'bitcoin' }: Props) {
  const [retryNonce, setRetryNonce] = useState(0);

  const { data, isPending, isError } = useQuery(
    getCoingeckoMarketChartQueryOptions({
      currency,
      coinId,
      retryNonce,
      enabled: !hidden,
    }),
  );

  if (hidden) return null;
  if (isError) {
    return (
      <ErrorRetry message="Could not load chart data" onRetry={() => setRetryNonce((k) => k + 1)} />
    );
  }

  if (isPending || !data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-[100px] w-full rounded" />
      </div>
    );
  }

  const first = data[0].price;
  const last = data[data.length - 1].price;
  const change7d = ((last - first) / first) * 100;
  const isUp = change7d >= 0;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (p: number) => formatBtcPrice(p, currency);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-sans text-secondary-foreground">
        <p className="uppercase tracking-wider text-sm font-sans text-secondary-foreground">
          7-day
        </p>
        <div className="flex items-center gap-1 text-muted-foreground">
          {isUp ? <TrendingUp className="h-3 w-3 text-secondary-foreground" /> : <TrendingDown className="h-3 w-3 text-secondary-foreground" />}
          <span className="text-sm font-sans text-secondary-foreground">
            {isUp ? '+' : '−'}{Math.abs(change7d).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-[100px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={100} debounce={50}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} className="font-sans">
            <defs>
              <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.12} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const point = payload[0].payload as CoingeckoMarketChartPoint;
                return (
                  <div className="bg-popover border border-border px-2 py-1 rounded text-[10px] font-mono shadow-sm">
                    <p className="text-foreground">{formatPrice(point.price)}</p>
                    <p className="text-muted-foreground">{formatDate(point.timestamp)}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
              fill="url(#btcGradient)"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 2.5, fill: 'hsl(var(--foreground))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
