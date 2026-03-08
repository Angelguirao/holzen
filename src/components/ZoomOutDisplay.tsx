import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Clock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { useHolzen } from '@/hooks/use-holzen';
import { formatBtcPrice } from '@/lib/btc';

interface OnThisDayEntry {
  yearsAgo: number;
  price: number;
  date: string;
}

export interface ZoomOutData {
  onThisDay: OnThisDayEntry[];
  currentPrice: number | null;
  echo: {
    message: string;
    created_at: string;
    mood: string | null;
    outcome: string | null;
  } | null;
  deepTime: {
    title: string;
    body: string;
  } | null;
}

interface Props {
  data: ZoomOutData | null;
  loading: boolean;
  error: boolean;
}

const outcomeLabels: Record<string, string> = {
  held: 'Held', hold: 'Held', sold: 'Sold', bought: 'Bought', nothing: 'Did nothing',
};

export function ZoomOutDisplay({ data, loading, error }: Props) {
  const { currency } = useHolzen();
  const fmtPrice = (n: number) => formatBtcPrice(n, currency);
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

  const { onThisDay, currentPrice, echo, deepTime } = data;

  return (
    <div className="space-y-4">
      {/* On this day - price timeline */}
      {currentPrice && onThisDay.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
            BTC on this day
          </p>
          <div className="space-y-1.5">
            {[...onThisDay].reverse().map((entry) => {
              const changePct = ((currentPrice - entry.price) / entry.price) * 100;
              const isUp = changePct >= 0;
              return (
                <div key={entry.yearsAgo} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
                    {entry.yearsAgo}y ago
                  </span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {fmtPrice(entry.price)}
                  </span>
                  <span className={`text-[10px] font-mono tabular-nums flex items-center gap-0.5 ${isUp ? 'text-primary/70' : 'text-destructive/70'}`}>
                    {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {isUp ? '+' : ''}{changePct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
              <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
                Now
              </span>
              <span className="text-xs font-mono text-foreground font-medium tabular-nums">
                {fmtPrice(currentPrice)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/40">—</span>
            </div>
          </div>
        </div>
      )}

      {/* Deep Time — civilizational / planetary perspective */}
      {deepTime && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3 text-muted-foreground/50" />
            <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              Deep time
            </p>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wide">
            {deepTime.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {deepTime.body}
          </p>
        </div>
      )}

      {/* Echo - real past reflection */}
      {echo ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground/50" />
            <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              Echo · {format(new Date(echo.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-3">
            "{echo.message}"
          </p>
          <div className="flex gap-1.5">
            {echo.mood && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                {echo.mood}
              </span>
            )}
            {echo.outcome && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                {outcomeLabels[echo.outcome] || echo.outcome}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground/50" />
            <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Echo</p>
          </div>
          <p className="text-xs text-muted-foreground/50 leading-relaxed italic">
            No past reflection to echo yet. Keep reflecting — your future self will thank you.
          </p>
        </div>
      )}
    </div>
  );
}
