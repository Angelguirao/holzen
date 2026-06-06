import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { MarketQuote } from '@/features/market/public';
import { formatPauseDepthPickerMarketLines } from '@/features/pause/domain/feel/format-pause-depth-picker-market-lines';

type Props = {
  marketData: MarketQuote | null;
  trackedAssetId: string;
};

/** Market move + “Within your range” block (Figma Wireframes 589:19155). */
export function PauseDepthPickerMarketContext({ marketData, trackedAssetId }: Props) {
  "use memo";
  const { t } = useTranslation();
  const lines = formatPauseDepthPickerMarketLines(marketData, trackedAssetId);
  if (!lines) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm leading-5 tracking-[0.005em] text-foreground">
        <span className="tabular-nums">{lines.sym} </span>
        <span
          className={cn(
            'tabular-nums',
            lines.direction === 'up' ? 'text-sky-400' : 'text-destructive',
          )}
          aria-hidden
        >
          {lines.arrow}
        </span>
        <span className="tabular-nums">
          {' '}
          {lines.pct}% · 24h
        </span>
        {lines.sentimentLine ? (
          <>
            {'    '}
            <span>{lines.sentimentLine}</span>
          </>
        ) : null}
      </p>
      <p className="text-center text-sm leading-5 tracking-[0.005em] text-muted-foreground">
        {t('home.market.withinYourRange', { defaultValue: 'Within your range' })}
      </p>
    </div>
  );
}
