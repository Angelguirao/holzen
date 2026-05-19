import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight } from 'lucide-react';
export type { CachedHistoricalInsightShape } from '@/features/pause/public';
import type { CachedHistoricalInsightShape } from '@/features/pause/public';
import { CompanionError } from './CompanionError';

interface Props {
  data: CachedHistoricalInsightShape | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function HistoricalInsightDisplay({ data, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error) {
    return <CompanionError companionType="history" onRetry={onRetry} />;
  }
  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* Title */}
      <p className="text-xs font-mono font-medium text-foreground leading-relaxed">
        {data.title}
      </p>

      {/* BTC insight */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <History className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Bitcoin · {data.period}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{data.btcInsight}</p>
      </div>

      {/* Cross-asset analogy */}
      <div className="space-y-1 pl-3 border-l-2 border-border/40">
        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
          <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">{data.assetClass} parallel</p>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed italic">{data.analogy}</p>
      </div>
    </div>
  );
}
