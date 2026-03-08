import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, Compass } from 'lucide-react';

interface ZoomOutData {
  perspective: string;
  echo: string;
  macro: string;
  prices: {
    current: number | null;
    oneYear: number | null;
    fourYears: number | null;
    tenYears: number | null;
  };
}

interface Props {
  data: ZoomOutData | null;
  loading: boolean;
  error: boolean;
}

function formatPrice(n: number | null): string {
  if (!n) return '—';
  return `$${n.toLocaleString()}`;
}

function calcChange(current: number | null, past: number | null): string {
  if (!current || !past) return '';
  const pct = ((current - past) / past) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

export function ZoomOutDisplay({ data, loading, error }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-xs text-muted-foreground/60 font-mono">
        Could not load zoom out data.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price timeline */}
      {data.prices.current && (data.prices.oneYear || data.prices.fourYears || data.prices.tenYears) && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {data.prices.tenYears && (
            <div className="shrink-0 text-center">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">10y ago</p>
              <p className="text-xs font-mono text-muted-foreground">{formatPrice(data.prices.tenYears)}</p>
              <p className="text-[9px] font-mono text-primary/70">{calcChange(data.prices.current, data.prices.tenYears)}</p>
            </div>
          )}
          {data.prices.fourYears && (
            <div className="shrink-0 text-center">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">4y ago</p>
              <p className="text-xs font-mono text-muted-foreground">{formatPrice(data.prices.fourYears)}</p>
              <p className="text-[9px] font-mono text-primary/70">{calcChange(data.prices.current, data.prices.fourYears)}</p>
            </div>
          )}
          {data.prices.oneYear && (
            <div className="shrink-0 text-center">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">1y ago</p>
              <p className="text-xs font-mono text-muted-foreground">{formatPrice(data.prices.oneYear)}</p>
              <p className="text-[9px] font-mono text-primary/70">{calcChange(data.prices.current, data.prices.oneYear)}</p>
            </div>
          )}
          <div className="shrink-0 text-center">
            <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">Now</p>
            <p className="text-xs font-mono text-foreground font-medium">{formatPrice(data.prices.current)}</p>
          </div>
        </div>
      )}

      {/* Perspective */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Perspective</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{data.perspective}</p>
      </div>

      {/* Echo */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground/50" />
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Echo</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic">{data.echo}</p>
      </div>

      {/* Macro */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Compass className="h-3 w-3 text-muted-foreground/50" />
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Macro</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{data.macro}</p>
      </div>
    </div>
  );
}
