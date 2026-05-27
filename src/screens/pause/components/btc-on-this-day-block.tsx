import { TrendingDown, TrendingUp, CloudOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BtcOnThisDayEntry } from '@/features/pause/domain/btc-on-this-day';

export type BtcOnThisDayBlockProps = {
  currentPrice: number;
  onThisDay: BtcOnThisDayEntry[];
  partial?: boolean;
  formatPrice: (n: number) => string;
};

/** BTC anniversary price rows for Look Back (wireframe: "BTC on this day"). */
export function BtcOnThisDayBlock({ currentPrice, onThisDay, partial, formatPrice }: BtcOnThisDayBlockProps) {
  "use memo";
  const { t } = useTranslation();
  if (!currentPrice || onThisDay.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          {t('pause.frame.lookBackContent.btcOnThisDay')}
        </p>
        {partial ? (
          <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/35">
            <CloudOff className="h-2.5 w-2.5" />
            {t('pause.frame.lookBackContent.partialData')}
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5">
        {[...onThisDay].reverse().map((entry) => {
          const changePct = ((currentPrice - entry.price) / entry.price) * 100;
          const isUp = changePct >= 0;
          return (
            <div key={entry.yearsAgo} className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
                {t('pause.frame.lookBackContent.yearsAgo', { count: entry.yearsAgo })}
              </span>
              <span className="text-xs font-mono text-muted-foreground tabular-nums">{formatPrice(entry.price)}</span>
              <span
                className={`text-[10px] font-mono tabular-nums flex items-center gap-0.5 ${isUp ? 'text-foreground/75' : 'text-destructive/70'}`}
              >
                {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {isUp ? '+' : ''}
                {changePct.toFixed(0)}%
              </span>
            </div>
          );
        })}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
          <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
            {t('pause.frame.lookBackContent.now')}
          </span>
          <span className="text-xs font-mono text-foreground font-medium tabular-nums">
            {formatPrice(currentPrice)}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/40">—</span>
        </div>
      </div>
    </div>
  );
}
