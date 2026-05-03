import { RefreshCw } from 'lucide-react';

interface HomePullRefreshIndicatorProps {
  pullDistance: number;
  pullRefreshing: boolean;
}

export function HomePullRefreshIndicator({ pullDistance, pullRefreshing }: HomePullRefreshIndicatorProps) {
  if (pullDistance <= 0 && !pullRefreshing) return null;
  return (
    <div
      className="flex items-center justify-center transition-all overflow-hidden"
      style={{ height: pullRefreshing ? 32 : pullDistance * 0.4 }}
    >
      <RefreshCw
        className={`h-4 w-4 text-muted-foreground/50 transition-transform ${pullRefreshing ? 'animate-spin' : ''}`}
        style={{ transform: pullRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
        aria-hidden
      />
    </div>
  );
}
