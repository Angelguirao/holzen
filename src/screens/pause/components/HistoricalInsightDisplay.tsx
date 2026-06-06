import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight } from 'lucide-react';
import { useProfile } from '@/features/user/public-hooks';
import { formatMarketPrice } from '@/features/market/public';
import { cn } from '@/lib/utils';
export type { CachedHistoricalInsightShape } from '@/features/pause/public-ritual-frame';
import type { CachedHistoricalInsightShape } from '@/features/pause/public-ritual-frame';
import { CompanionError } from './CompanionError';
import { BtcOnThisDayBlock } from '@/screens/pause/components/btc-on-this-day-block';
import { LookBackFrameDisplay } from '@/screens/pause/components/look-back-frame-display';

export type HistoricalInsightDisplayVariant = 'default' | 'frame';

interface Props {
  data: CachedHistoricalInsightShape | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  variant?: HistoricalInsightDisplayVariant;
}

export function HistoricalInsightDisplay({
  data,
  loading,
  error,
  onRetry,
  variant = 'default',
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const { currency } = useProfile();
  const fmtPrice = (n: number) => formatMarketPrice(n, currency);
  const isFrame = variant === 'frame';

  if (loading) {
    return (
      <div className={cn('space-y-3', isFrame && 'px-1 pt-4')}>
        <Skeleton className={cn(isFrame ? 'h-4 w-full' : 'h-3 w-3/4')} />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(isFrame && 'px-1 pt-2')}>
        <CompanionError companionType="history" onRetry={onRetry} />
      </div>
    );
  }
  if (!data) return null;

  if (isFrame) {
    return <LookBackFrameDisplay data={data} formatPrice={fmtPrice} />;
  }

  const hasBtcPrices =
    typeof data.currentPrice === 'number' && (data.onThisDay?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {data.title ? (
        <p className="text-xs font-mono font-medium text-foreground leading-relaxed">{data.title}</p>
      ) : null}

      {hasBtcPrices && data.currentPrice ? (
        <BtcOnThisDayBlock
          currentPrice={data.currentPrice}
          onThisDay={data.onThisDay ?? []}
          partial={data.partial}
          formatPrice={fmtPrice}
        />
      ) : null}

      {data.btcInsight ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <History className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              {data.period
                ? t('pause.frame.lookBackContent.btcInsightLabel', { period: data.period })
                : t('pause.frame.lookBackContent.btcInsightFallback')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {data.btcInsight ?? t('companions.lookBackBtcInsightFallback')}
          </p>
        </div>
      ) : null}

      {data.analogy ? (
        <div className="space-y-1 pl-3 border-l-2 border-border/40">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
            <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">
              {data.assetClass
                ? t('pause.frame.lookBackContent.mirrorMomentWithAsset', { assetClass: data.assetClass })
                : t('pause.frame.lookBackContent.mirrorMoment')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/80 leading-relaxed italic">{data.analogy}</p>
        </div>
      ) : null}
    </div>
  );
}
