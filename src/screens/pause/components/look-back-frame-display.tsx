import { BookOpen, GitCompare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CachedHistoricalInsightShape } from '@/features/pause/public-ritual-frame';
import { BtcOnThisDayBlock } from '@/screens/pause/components/btc-on-this-day-block';

export type LookBackFrameDisplayProps = {
  data: CachedHistoricalInsightShape;
  formatPrice: (n: number) => string;
};

/**
 * Frame inline Look back — Figma wireframes: lead → gray BTC panel → purple mirror panel.
 */
export function LookBackFrameDisplay({ data, formatPrice }: LookBackFrameDisplayProps) {
  "use memo";
  const { t } = useTranslation();

  const hasBtcPrices =
    typeof data.currentPrice === 'number' && (data.onThisDay?.length ?? 0) > 0;
  const hasMirror = Boolean(data.title || data.btcInsight || data.analogy);
  const periodLabel = data.period
    ? t('pause.frame.lookBackContent.btcInsightLabel', { period: data.period })
    : t('pause.frame.lookBackContent.btcInsightFallback');

  return (
    <div className="space-y-4 px-1 pt-4">
      <p className="text-center text-base italic leading-6 text-foreground">
        {t('pause.frame.lookBackContent.marketLead')}
      </p>

      {hasBtcPrices && data.currentPrice ? (
        <div className="space-y-4 rounded-lg bg-muted p-2">
          <BtcOnThisDayBlock
            variant="frame"
            currentPrice={data.currentPrice}
            onThisDay={data.onThisDay ?? []}
            partial={data.partial}
            formatPrice={formatPrice}
          />
          <p className="px-1 pb-2 text-center text-sm font-medium leading-5 tracking-wide text-muted-foreground">
            {t('pause.frame.lookBackContent.tableClosing')}
          </p>
        </div>
      ) : null}

      {hasMirror ? (
        <div className="space-y-2 rounded-lg bg-primary/5 p-2">
          <p className="py-1 text-center text-base italic leading-6 text-foreground">
            {t('pause.frame.lookBackContent.mirrorHeading')}
          </p>

          {data.title || data.btcInsight ? (
            <div className="space-y-2 pb-2">
              {data.title ? (
                <div className="flex items-start gap-2.5 pt-2">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium leading-5 tracking-wide text-foreground">
                    {data.title}
                    {data.period ? (
                      <>
                        {' '}
                        <span className="font-normal italic">{periodLabel.toUpperCase()}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              ) : null}
              {data.btcInsight ? (
                <p className="text-sm leading-5 tracking-wide text-foreground">{data.btcInsight}</p>
              ) : null}
            </div>
          ) : null}

          {data.analogy ? (
            <>
              {data.title || data.btcInsight ? (
                <div className="border-t border-dashed border-border/50" aria-hidden />
              ) : null}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2.5">
                  <GitCompare className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium leading-5 tracking-wide text-foreground">
                    {data.assetClass
                      ? t('pause.frame.lookBackContent.mirrorMomentWithAsset', {
                          assetClass: data.assetClass,
                        })
                      : t('pause.frame.lookBackContent.analogyHeading')}
                  </p>
                </div>
                <p className="text-sm leading-5 tracking-wide text-foreground">{data.analogy}</p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
