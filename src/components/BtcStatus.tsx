import { Eye, EyeOff, WifiOff, Bitcoin, Clock } from 'lucide-react';
import { BtcChart } from '@/components/BtcChart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBtcPrice, type BtcPriceData } from '@/lib/btc';
import { useTranslation } from 'react-i18next';

interface Props {
  data: BtcPriceData | null;
  error: string | null;
  hidden: boolean;
  onToggleHidden: () => void;
  currency?: string;
  btcMode?: boolean;
  onToggleBtcMode?: () => void;
}

export function BtcStatus({ data, error, hidden, onToggleHidden, currency = 'USD', btcMode = false, onToggleBtcMode }: Props) {
  const { t } = useTranslation();
  const toggle = onToggleHidden;

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5" />
          <p className="text-xs font-mono">{t('btcStatus.unableToFetch')}</p>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/60">
          {t('btcStatus.checkConnection')}
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

  if (btcMode) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground/50">BTC / BTC</p>
            <div className="flex items-center gap-2">
              {onToggleBtcMode && (
                <button
                  onClick={onToggleBtcMode}
                  className="text-primary/60 hover:text-primary transition-colors"
                  aria-label={t('btcStatus.exitBtcMode')}
                  title={t('btcStatus.exitBtcMode')}
                >
                  <Bitcoin className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={toggle}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={hidden ? t('btcStatus.show') : t('btcStatus.hide')}
              >
                {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {hidden ? (
            <>
              <p className="text-2xl font-mono tracking-tight text-muted-foreground/30">••••••</p>
              <p className="text-sm font-mono text-muted-foreground/30">••••</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-mono tracking-tight text-foreground/80">1 BTC = 1 BTC</p>
              <p className="text-[10px] font-mono text-muted-foreground/40 leading-relaxed">
                {t('btcStatus.priceIsNoise')}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const cur = data.currency || currency;
  const dir = data.direction === 'down' ? '−' : '+';
  const pct = Math.abs(data.changePercent).toFixed(1);
  const price = formatBtcPrice(data.currentPrice, cur);

  const fearGreedColor = data.fearGreed
    ? data.fearGreed.value <= 25 ? 'text-destructive'
      : data.fearGreed.value <= 45 ? 'text-orange-500'
      : data.fearGreed.value <= 55 ? 'text-muted-foreground'
      : data.fearGreed.value <= 75 ? 'text-chart-2'
      : 'text-primary'
    : '';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-muted-foreground">BTC / {cur}</p>
            {data._stale && (
              <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/40" title="Using cached data — live APIs unavailable">
                <Clock className="h-2.5 w-2.5" />
                cached
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onToggleBtcMode && (
              <button
                onClick={onToggleBtcMode}
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                aria-label={t('btcStatus.enterBtcMode')}
                title="1 BTC = 1 BTC"
              >
                <Bitcoin className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={toggle}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={hidden ? t('btcStatus.showPrice') : t('btcStatus.hidePrice')}
            >
              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        {hidden ? (
          <>
            <p className="text-2xl font-mono tracking-tight text-muted-foreground/30">••••••</p>
            <p className="text-sm font-mono text-muted-foreground/30">••••</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-mono tracking-tight">{price}</p>
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-muted-foreground">
                {dir}{pct}% {t('btcStatus.in24h')}
              </p>
              {data.fearGreed && (
                <p className={`text-[10px] font-mono ${fearGreedColor}`}>
                  {data.fearGreed.value} · {data.fearGreed.label}
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <BtcChart hidden={hidden} currency={cur} />
    </div>
  );
}
