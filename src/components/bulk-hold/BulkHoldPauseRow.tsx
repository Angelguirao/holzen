import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  formatBulkHoldContextQuote,
  formatBulkHoldLocalTime,
  parseBulkHoldChange24hPct,
  type BulkHoldOutcomeChoice,
  type BulkHoldPendingPause,
} from '@/lib/bulk-hold';
import { cn } from '@/lib/utils';

interface BulkHoldPauseRowProps {
  pause: BulkHoldPendingPause;
  language: string;
  /** Selected outcome for this pause, if any. */
  value: BulkHoldOutcomeChoice | undefined;
  onValueChange: (pauseId: string, outcome: BulkHoldOutcomeChoice) => void;
}

export function BulkHoldPauseRow({ pause, language, value, onValueChange }: BulkHoldPauseRowProps) {
  const { t } = useTranslation();
  const snap = pause.context_snapshot;
  const pct = parseBulkHoldChange24hPct(snap);
  const quote = formatBulkHoldContextQuote(snap);
  const timeLine = formatBulkHoldLocalTime(pause.created_at, language);

  return (
    <Collapsible defaultOpen className="group rounded-lg border-2 border-border/60 bg-muted/25">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <div className="min-w-0 text-base font-medium tabular-nums text-muted-foreground">
          <span className="text-foreground">{timeLine}</span>
          {pct != null ? (
            <>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <span>BTC </span>
              <span className={cn(pct >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {pct >= 0 ? '+' : ''}
                {pct.toFixed(1)}%
              </span>
            </>
          ) : null}
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 border-t border-border/40 px-4 pb-4 pt-2">
          {quote ? (
            <p className="text-sm font-medium italic leading-snug text-foreground">{quote}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('bulkHold.reviewNoContext', { defaultValue: 'No reflection line was saved for this pause.' })}
            </p>
          )}
          <RadioGroup
            className="flex flex-row flex-wrap gap-x-4 gap-y-2"
            value={value}
            onValueChange={(v) => onValueChange(pause.id, v as BulkHoldOutcomeChoice)}
            aria-label={t('bulkHold.outcomeGroupAria')}
          >
            <label
              htmlFor={`${pause.id}-held`}
              className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm font-medium text-foreground"
            >
              <RadioGroupItem value="held" id={`${pause.id}-held`} className="border-muted-foreground/50" />
              {t('bulkHold.outcomeHeld', { defaultValue: 'I held' })}
            </label>
            <label
              htmlFor={`${pause.id}-bought`}
              className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm font-medium text-foreground"
            >
              <RadioGroupItem value="bought" id={`${pause.id}-bought`} className="border-muted-foreground/50" />
              {t('bulkHold.outcomeBought', { defaultValue: 'I bought' })}
            </label>
            <label
              htmlFor={`${pause.id}-sold`}
              className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-2 text-sm font-medium text-foreground"
            >
              <RadioGroupItem value="sold" id={`${pause.id}-sold`} className="border-muted-foreground/50" />
              {t('bulkHold.outcomeSold', { defaultValue: 'I sold' })}
            </label>
          </RadioGroup>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
