import { Eye, EyeOff, WifiOff, Bitcoin, Clock, ChevronDown } from 'lucide-react';
import { BtcChartLazyGate } from '@/components/BtcChartLazyGate';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBtcPrice, type BtcPriceData } from '@/lib/btc';
import { useTranslation } from 'react-i18next';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

interface Props {
  data: BtcPriceData | null;
  error: string | null;
  hidden: boolean;
  onToggleHidden: () => void;
  currency?: string;
  btcMode?: boolean;
  onToggleBtcMode?: () => void;
  /** When set, headline price row includes a chevron to show/hide chart + 24h detail below the price. */
  chartExpanded?: boolean;
  onToggleChartExpanded?: () => void;
}

export function BtcStatus({
  data,
  error,
  hidden,
  onToggleHidden,
  currency = 'USD',
  btcMode = false,
  onToggleBtcMode,
  chartExpanded = true,
  onToggleChartExpanded,
}: Props) {
  const { t } = useTranslation();
  const toggle = onToggleHidden;

  const bitcoinToggleBtn = onToggleBtcMode ? (
    <button
      type="button"
      onClick={onToggleBtcMode}
      className={cn(
        homeInWidget.iconBtn,
        btcMode ? 'text-primary/60 hover:text-primary' : 'text-muted-foreground/40 hover:text-primary',
      )}
      aria-label={btcMode ? t('btcStatus.exitBtcMode') : t('btcStatus.enterBtcMode')}
      title={btcMode ? t('btcStatus.exitBtcMode') : t('btcStatus.enterBtcMode')}
    >
      <Bitcoin className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
    </button>
  ) : null;

  const eyeToggleBtn = (
    <button
      type="button"
      onClick={toggle}
      className={homeInWidget.iconBtn}
      aria-label={
        btcMode
          ? hidden
            ? t('btcStatus.show')
            : t('btcStatus.hide')
          : hidden
            ? t('btcStatus.showPrice')
            : t('btcStatus.hidePrice')
      }
    >
      {hidden ? (
        <EyeOff className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
      ) : (
        <Eye className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
      )}
    </button>
  );

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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex shrink-0 gap-1">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (btcMode) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className={homeInWidget.kicker}>BTC / BTC</p>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
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
            <div className="flex shrink-0 items-center justify-end gap-1">
              {bitcoinToggleBtn}
              {eyeToggleBtn}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = data.currency || currency;
  const dir = data.direction === 'down' ? '−' : '+';
  const pct = Math.abs(data.changePercent).toFixed(1);
  const price = formatBtcPrice(data.currentPrice, cur);

  const fearGreedColor = data.fearGreed
    ? data.fearGreed.value <= 25
      ? 'text-destructive'
      : data.fearGreed.value <= 45
        ? 'text-secondary-foreground'
        : data.fearGreed.value <= 55
          ? 'text-muted-foreground'
          : data.fearGreed.value <= 75
            ? 'text-chart-2'
            : 'text-primary'
    : '';

  const showChartBlock = !hidden && chartExpanded;
  const chartChevronToggle = onToggleChartExpanded ? (
    <button
      type="button"
      onClick={onToggleChartExpanded}
      className={homeInWidget.iconBtn}
      aria-expanded={chartExpanded}
      aria-label={chartExpanded ? t('home.market.collapseDetails') : t('home.market.expandDetails')}
    >
      <ChevronDown
        className={cn(
          'h-4 w-4 text-secondary-foreground transition-transform duration-200',
          !chartExpanded && '-rotate-90',
        )}
        aria-hidden
      />
    </button>
  ) : null;

  const priceRowToolbar = (
    <div className="flex shrink-0 items-center justify-end gap-1">
      {bitcoinToggleBtn}
      {eyeToggleBtn}
      {chartChevronToggle}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p className={homeInWidget.kicker}>BTC / {cur}</p>
          {data._stale && (
            <span className={`flex items-center gap-1 ${homeInWidget.metaFaint}`} title="Using cached data — live APIs unavailable">
              <Clock className="h-2.5 w-2.5" />
              cached
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {hidden ? (
              <>
                <p className={homeInWidget.priceHidden}>••••••</p>
                <p className={homeInWidget.subPriceHidden}>••••</p>
              </>
            ) : (
              <p className={homeInWidget.price}>{price}</p>
            )}
          </div>
          {priceRowToolbar}
        </div>
        {showChartBlock ? (
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
        ) : null}
      </div>
      {showChartBlock ? (
        <div>
          <BtcChartLazyGate hidden={hidden} currency={cur} />
        </div>
      ) : null}
    </div>
  );
}
