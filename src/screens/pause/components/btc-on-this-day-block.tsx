import { TrendingDown, TrendingUp, CloudOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BtcOnThisDayEntry } from '@/features/pause/domain/btc-on-this-day';

export type BtcOnThisDayBlockProps = {
  currentPrice: number;
  onThisDay: BtcOnThisDayEntry[];
  partial?: boolean;
  formatPrice: (n: number) => string;
  /** Frame wireframe: centered header + three columnar stacks inside the gray panel. */
  variant?: 'default' | 'frame';
};

function BtcOnThisDayRows({
  currentPrice,
  onThisDay,
  formatPrice,
  frame,
}: {
  currentPrice: number;
  onThisDay: BtcOnThisDayEntry[];
  formatPrice: (n: number) => string;
  frame: boolean;
}) {
  const { t } = useTranslation();
  const rows = [...onThisDay].reverse();

  if (frame) {
    const labels: string[] = rows.map((entry) =>
      t('pause.frame.lookBackContent.yearsAgo', { count: entry.yearsAgo }),
    );
    labels.push(t('pause.frame.lookBackContent.today'));

    const prices: string[] = rows.map((entry) => formatPrice(entry.price));
    prices.push(formatPrice(currentPrice));

    const changes: string[] = rows.map((entry) => {
      const changePct = ((currentPrice - entry.price) / entry.price) * 100;
      const isUp = changePct >= 0;
      return `${isUp ? '+' : ''}${changePct.toFixed(0)}%`;
    });
    changes.push('');

    return (
      <div className="flex w-full gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0 text-base italic leading-6 text-muted-foreground">
          {labels.map((label, i) => (
            <p key={`y-${label}`} className={i === labels.length - 1 ? 'font-medium not-italic text-foreground' : ''}>
              {label}
            </p>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0 text-base leading-6 text-foreground tabular-nums">
          {prices.map((price, i) => (
            <p key={`p-${price}`} className={i === prices.length - 1 ? 'font-semibold' : ''}>
              {price}
            </p>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0 text-base leading-6 text-muted-foreground tabular-nums">
          {changes.map((change) => (
            <p key={`c-${change}`}>{change}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {rows.map((entry) => {
        const changePct = ((currentPrice - entry.price) / entry.price) * 100;
        const isUp = changePct >= 0;
        return (
          <div key={entry.yearsAgo} className="flex items-center justify-between gap-2">
            <span className="w-16 shrink-0 text-[10px] font-mono text-muted-foreground/60">
              {t('pause.frame.lookBackContent.yearsAgo', { count: entry.yearsAgo })}
            </span>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">{formatPrice(entry.price)}</span>
            <span
              className={`flex items-center gap-0.5 text-[10px] font-mono tabular-nums ${isUp ? 'text-foreground/75' : 'text-destructive/70'}`}
            >
              {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {isUp ? '+' : ''}
              {changePct.toFixed(0)}%
            </span>
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-1">
        <span className="w-16 shrink-0 text-[10px] font-mono text-muted-foreground/60">
          {t('pause.frame.lookBackContent.now')}
        </span>
        <span className="text-xs font-mono font-medium text-foreground tabular-nums">
          {formatPrice(currentPrice)}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/40">—</span>
      </div>
    </div>
  );
}

/** BTC anniversary price rows for Look Back (wireframe: "BTC on this day"). */
export function BtcOnThisDayBlock({
  currentPrice,
  onThisDay,
  partial,
  formatPrice,
  variant = 'default',
}: BtcOnThisDayBlockProps) {
  "use memo";
  const { t } = useTranslation();
  if (!currentPrice || onThisDay.length === 0) return null;

  const frame = variant === 'frame';

  return (
    <div className="space-y-2">
      <div className={frame ? 'flex items-center justify-center pb-2' : 'flex items-center justify-between'}>
        <p
          className={
            frame
              ? 'text-center text-base italic leading-6 text-foreground'
              : 'text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50'
          }
        >
          {frame
            ? t('pause.frame.lookBackContent.btcOnThisDayHeading')
            : t('pause.frame.lookBackContent.btcOnThisDay')}
        </p>
        {!frame && partial ? (
          <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/35">
            <CloudOff className="h-2.5 w-2.5" />
            {t('pause.frame.lookBackContent.partialData')}
          </span>
        ) : null}
      </div>
      {frame && partial ? (
        <p className="text-center text-[10px] font-mono text-muted-foreground/45">
          {t('pause.frame.lookBackContent.partialData')}
        </p>
      ) : null}
      <BtcOnThisDayRows
        currentPrice={currentPrice}
        onThisDay={onThisDay}
        formatPrice={formatPrice}
        frame={frame}
      />
    </div>
  );
}
