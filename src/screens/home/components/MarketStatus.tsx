import { Eye, EyeOff, WifiOff, Bitcoin, CircleDollarSign, Clock, ChevronDown } from 'lucide-react';
import { MarketChartLazyGate } from '@/screens/home/components/MarketChartLazyGate';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMarketPrice, trackedAssetSymbol, type MarketQuote } from '@/features/market/public';
import { useTranslation } from 'react-i18next';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

interface Props {
  data: MarketQuote | null;
  error: string | null;
  hidden: boolean;
  onToggleHidden: () => void;
  currency?: string;
  unitBasisMode?: boolean;
  onToggleUnitBasisMode?: () => void;
  /** When set, headline price row includes a chevron to show/hide chart + 24h detail below the price. */
  chartExpanded?: boolean;
  onToggleChartExpanded?: () => void;
  /** When false, omit the price-row chevron (e.g. Home puts the control in `HomeSectionCard` header). */
  chartChevronInPriceRow?: boolean;
  /** CoinGecko id; used for labels when `data` is null. Defaults from `data.coinId` when present. */
  coinId?: string;
}

export function MarketStatus({
  data,
  error,
  hidden,
  onToggleHidden,
  currency = 'USD',
  coinId: coinIdProp,
  unitBasisMode = false,
  onToggleUnitBasisMode,
  chartExpanded = true,
  onToggleChartExpanded,
  chartChevronInPriceRow = true,
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const toggle = onToggleHidden;
  const quoteSym = trackedAssetSymbol(data?.coinId ?? coinIdProp ?? 'bitcoin');

  const fiatLabelCurrency = (data?.currency ?? currency).toUpperCase();

  /** Fiat row only — hidden price + “1 BTC” mode would be incoherent. */
  const enterBtcToolbarBtn =
    onToggleUnitBasisMode && !unitBasisMode && !hidden ? (
      <button
        type="button"
        onClick={onToggleUnitBasisMode}
        className={cn(homeInWidget.iconBtn, 'text-muted-foreground/40 hover:text-foreground')}
        aria-label={t('marketStatus.enterUnitBasisMode')}
        title={t('marketStatus.enterUnitBasisMode')}
      >
        <Bitcoin className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
      </button>
    ) : null;

  /** BTC / BTC row — always offer a way back to fiat quote. */
  const exitBtcToolbarBtn =
    onToggleUnitBasisMode && unitBasisMode ? (
      <button
        type="button"
        onClick={onToggleUnitBasisMode}
        className={cn(homeInWidget.iconBtn, 'text-foreground/50 hover:text-foreground')}
        aria-label={t('marketStatus.exitUnitBasisMode', { currency: fiatLabelCurrency })}
        title={t('marketStatus.exitUnitBasisMode', { currency: fiatLabelCurrency })}
      >
        <CircleDollarSign className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />
      </button>
    ) : null;

  const eyeToggleBtn = (
    <button
      type="button"
      onClick={toggle}
      className={homeInWidget.iconBtn}
      aria-label={hidden ? t('marketStatus.showPrice') : t('marketStatus.hidePrice')}
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
          <p className={homeInWidget.meta}>{t('marketStatus.unableToFetch')}</p>
        </div>
        <p className={homeInWidget.metaFaint}>{t('marketStatus.checkConnection')}</p>
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

  if (unitBasisMode) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className={homeInWidget.kicker}>
            {quoteSym} / {quoteSym}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              {hidden ? (
                <>
                  <p className={homeInWidget.priceHidden}>••••••</p>
                  <p className={homeInWidget.subPriceHidden}>••••</p>
                </>
              ) : (
                <>
                  <p className={`${homeInWidget.price} text-foreground/90`}>
                    1 {quoteSym} = 1 {quoteSym}
                  </p>
                  <p className="leading-snug text-sm text-[#dbb266]">{t('marketStatus.priceIsNoise')}</p>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1">
              {eyeToggleBtn}
              {exitBtcToolbarBtn}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = data.currency || currency;
  const dir = data.direction === 'down' ? '−' : '+';
  const pct = Math.abs(data.changePercent).toFixed(1);
  const price = formatMarketPrice(data.currentPrice, cur);

  const fearGreedColor = data.fearGreed
    ? data.fearGreed.value <= 25
      ? 'text-destructive'
      : data.fearGreed.value <= 45
        ? 'text-secondary-foreground'
        : data.fearGreed.value <= 55
          ? 'text-muted-foreground'
          : data.fearGreed.value <= 75
            ? 'text-chart-2'
            : 'text-nox-accent-green'
    : '';

  /** Collapsed: pair + price + footer only (Figma 251:17255). Expand reveals 24h/F&G + 7-day chart. */
  const showExpandedDetails = !hidden && chartExpanded;
  const chartChevronToggle =
    chartChevronInPriceRow && onToggleChartExpanded ? (
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
      {enterBtcToolbarBtn}
      {eyeToggleBtn}
      {chartChevronToggle}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <p className={homeInWidget.kicker}>
            {quoteSym} / {cur}
          </p>
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
        {showExpandedDetails ? (
          <p className={homeInWidget.subPrice}>
            {dir}{pct}% {t('marketStatus.in24h')}
            {data.fearGreed ? (
              <>
                {' · '}
                <span className={`font-medium tabular-nums ${fearGreedColor}`}>
                  {data.fearGreed.value} {data.fearGreed.label}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      {showExpandedDetails ? (
        <div>
          <MarketChartLazyGate hidden={hidden} currency={cur} coinId={data?.coinId ?? coinIdProp ?? 'bitcoin'} />
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use MarketStatus */
export const BtcStatus = MarketStatus;
