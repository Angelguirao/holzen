import type { RefObject } from 'react';
import { Eye, EyeOff, WifiOff, Bitcoin, Clock } from 'lucide-react';
import { BtcChartLazyGate } from '@/components/BtcChartLazyGate';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBtcPrice, type BtcPriceData } from '@/lib/btc';
import { useTranslation } from 'react-i18next';
import { homeInWidget } from '@/components/home/home-widget-styles';

interface Props {
  data: BtcPriceData | null;
  error: string | null;
  hidden: boolean;
  onToggleHidden: () => void;
  currency?: string;
  btcMode?: boolean;
  onToggleBtcMode?: () => void;
  /** When true, price row omits inline toolbar (parent renders duplicate controls in card header). */
  suppressToolbar?: boolean;
  /** Attach to the chart wrapper for scroll-into-view from the parent header. */
  chartWrapperRef?: RefObject<HTMLDivElement | null>;
}

export function BtcStatus({
  data,
  error,
  hidden,
  onToggleHidden,
  currency = 'USD',
  btcMode = false,
  onToggleBtcMode,
  suppressToolbar = false,
  chartWrapperRef,
}: Props) {
  const { t } = useTranslation();
  const toggle = onToggleHidden;

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <p className={homeInWidget.meta}>{t('btcStatus.unableToFetch')}</p>
        </div>
        <p className={homeInWidget.metaFaint}>{t('btcStatus.checkConnection')}</p>
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
          <div className={suppressToolbar ? 'space-y-0' : 'flex items-center justify-between'}>
            <p className={homeInWidget.kicker}>BTC / BTC</p>
            {!suppressToolbar ? (
              <div className="flex items-center gap-1">
                {onToggleBtcMode && (
                  <button
                    type="button"
                    onClick={onToggleBtcMode}
                    className={`${homeInWidget.iconBtn} text-primary/60 hover:text-primary`}
                    aria-label={t('btcStatus.exitBtcMode')}
                    title={t('btcStatus.exitBtcMode')}
                  >
                    <Bitcoin className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggle}
                  className={homeInWidget.iconBtn}
                  aria-label={hidden ? t('btcStatus.show') : t('btcStatus.hide')}
                >
                  {hidden ? <EyeOff className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden /> : <Eye className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />}
                </button>
              </div>
            ) : null}
          </div>
          {hidden ? (
            <>
              <p className={homeInWidget.priceHidden}>••••••</p>
              <p className={homeInWidget.subPriceHidden}>••••</p>
            </>
          ) : (
            <>
              <p className={`${homeInWidget.price} text-foreground/90`}>1 BTC = 1 BTC</p>
              <p className="leading-snug text-sm text-[#dbb266]">{t('btcStatus.priceIsNoise')}</p>
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
      : data.fearGreed.value <= 45 ? 'text-secondary-foreground'
      : data.fearGreed.value <= 55 ? 'text-muted-foreground'
      : data.fearGreed.value <= 75 ? 'text-chart-2'
      : 'text-primary'
    : '';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {suppressToolbar ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className={homeInWidget.kicker}>BTC / {cur}</p>
            {data._stale && (
              <span className={`flex items-center gap-1 ${homeInWidget.metaFaint}`} title="Using cached data — live APIs unavailable">
                <Clock className="h-2.5 w-2.5" />
                cached
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className={homeInWidget.kicker}>BTC / {cur}</p>
              {data._stale && (
                <span className={`flex items-center gap-1 ${homeInWidget.metaFaint}`} title="Using cached data — live APIs unavailable">
                  <Clock className="h-2.5 w-2.5" />
                  cached
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onToggleBtcMode && (
                <button
                  type="button"
                  onClick={onToggleBtcMode}
                  className={`${homeInWidget.iconBtn} text-muted-foreground/40 hover:text-primary`}
                  aria-label={t('btcStatus.enterBtcMode')}
                  title="1 BTC = 1 BTC"
                >
                  <Bitcoin className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={toggle}
                className={homeInWidget.iconBtn}
                aria-label={hidden ? t('btcStatus.showPrice') : t('btcStatus.hidePrice')}
              >
                {hidden ? <EyeOff className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden /> : <Eye className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />}
              </button>
            </div>
          </div>
        )}
        {hidden ? (
          <>
            <p className={homeInWidget.priceHidden}>••••••</p>
            <p className={homeInWidget.subPriceHidden}>••••</p>
          </>
        ) : (
          <>
            <p className={homeInWidget.price}>{price}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className={homeInWidget.subPrice}>
                {dir}{pct}% {t('btcStatus.in24h')}
              </p>
              {data.fearGreed && (
                <p className={`text-xs font-medium tabular-nums ${fearGreedColor}`}>
                  {data.fearGreed.value} · {data.fearGreed.label}
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div ref={chartWrapperRef ?? undefined}>
        <BtcChartLazyGate hidden={hidden} currency={cur} />
      </div>
    </div>
  );
}
