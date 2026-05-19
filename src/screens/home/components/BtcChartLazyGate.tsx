import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const BtcChartLazy = lazy(async () => {
  const m = await import('@/screens/home/components/BtcChart');
  return { default: m.BtcChart };
});

function ChartSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-[100px] w-full rounded" />
    </div>
  );
}

interface Props {
  hidden?: boolean;
  currency?: string;
  coinId?: string;
}

/**
 * Defers Recharts + CoinGecko chart fetch until near viewport — cuts main-thread layout work on cold Home paint.
 */
export function BtcChartLazyGate({ hidden = false, currency = 'USD', coinId = 'bitcoin' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mountChart, setMountChart] = useState(false);

  useEffect(() => {
    if (hidden || mountChart) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setMountChart(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '180px 0px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hidden, mountChart]);

  useEffect(() => {
    setMountChart(false);
  }, [coinId]);

  if (hidden) return null;

  return (
    <div ref={containerRef} className="min-h-[132px] w-full">
      {!mountChart ? (
        <ChartSkeleton />
      ) : (
        <Suspense fallback={<ChartSkeleton />}>
          <BtcChartLazy hidden={false} currency={currency} coinId={coinId} />
        </Suspense>
      )}
    </div>
  );
}
