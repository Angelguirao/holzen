import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Clock, PenLine } from 'lucide-react';
import type { ZoomOutEchoData } from '@/features/pause/public-hooks';

const OUTCOME_LABELS: Record<string, string> = {
  held: 'Held',
  hold: 'Held',
  sold: 'Sold',
  bought: 'Bought',
  nothing: 'Held',
};

export type ZoomOutEchoPanelProps = {
  echo: ZoomOutEchoData | null | undefined;
  onGoToReplay: () => void;
};

/** User-authored echo (notes/replays) with optional thread CTA. */
export function ZoomOutEchoPanel({ echo, onGoToReplay }: ZoomOutEchoPanelProps) {
  const { t } = useTranslation();
  const [quoteExpanded, setQuoteExpanded] = useState(false);

  const userWords = echo?.userWords ?? [];
  const primary = userWords[0];
  const extraCount = Math.max(0, userWords.length - 1);

  if (!echo || !primary) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground/50" />
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
            {t('companions.echoEmptyTitle')}
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60 leading-relaxed">{t('companions.echoEmptyBody')}</p>
      </div>
    );
  }

  const quoteLong = primary.body.length > 220;

  return (
    <div className="rounded-lg border border-border/40 bg-muted/[0.08] px-3.5 py-3 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground/50" />
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
            {t('companions.echoHeader', {
              date: format(new Date(primary.created_at), 'MMM d, yyyy'),
              kind:
                primary.kind === 'replay' ? t('companions.echoKindReplay') : t('companions.echoKindNote'),
            })}
          </p>
        </div>
        <p
          className={`text-xs text-muted-foreground leading-relaxed italic ${quoteExpanded ? '' : 'line-clamp-4'}`}
        >
          &ldquo;{primary.body}&rdquo;
        </p>
        {quoteLong ? (
          <button
            type="button"
            onClick={() => setQuoteExpanded((v) => !v)}
            className="text-[9px] font-mono text-muted-foreground/50 hover:text-muted-foreground/70 flex items-center gap-1"
          >
            {quoteExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {quoteExpanded
              ? t('common.showLess', { defaultValue: 'Show less' })
              : t('companions.echoExpandQuote')}
          </button>
        ) : null}
        <div className="flex gap-1.5 flex-wrap">
          {echo.mood ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              {echo.mood}
            </span>
          ) : null}
          {echo.outcome ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              {OUTCOME_LABELS[echo.outcome] || echo.outcome}
            </span>
          ) : null}
        </div>
        {extraCount > 0 ? (
          <p className="text-[10px] font-mono text-muted-foreground/55">
            {t('companions.echoMoreEntries', { count: extraCount })}
          </p>
        ) : null}
      </div>

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{t('companions.echoFraming')}</p>
      <div className="space-y-1">
        <p className="text-[9px] font-mono text-muted-foreground/45 uppercase tracking-wider">
          {t('companions.echoPromptIntro')}
        </p>
        <ul className="text-[10px] text-muted-foreground/65 leading-relaxed list-disc pl-4 space-y-0.5">
          <li>{t('companions.echoPrompt1')}</li>
          <li>{t('companions.echoPrompt2')}</li>
          <li>{t('companions.echoPrompt3')}</li>
        </ul>
      </div>

      {echo.id ? (
        <button
          type="button"
          onClick={onGoToReplay}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-primary/25 bg-primary/[0.06] hover:bg-primary/[0.1] transition-colors"
        >
          <PenLine className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase">
            {extraCount > 0 ? t('companions.echoContinueThreadCta') : t('companions.echoRespondCta')}
          </span>
        </button>
      ) : null}
    </div>
  );
}
