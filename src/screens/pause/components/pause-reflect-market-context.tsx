import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { trackPauseReflectContextStripExpanded } from '@/features/pause/public-ritual-reflect';

export type PauseReflectMarketContextProps = {
  pauseInstanceId: string | null;
  marketContext: string | null;
  contextStrip: string | null;
};

/** Collapsed by default — raw market telemetry + optional narrative strip. */
export function PauseReflectMarketContext({
  pauseInstanceId,
  marketContext,
  contextStrip,
}: PauseReflectMarketContextProps) {
  "use memo";
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const market = marketContext?.trim() ?? '';
  const strip = contextStrip?.trim() ?? '';
  if (!market && !strip) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          trackPauseReflectContextStripExpanded(pauseInstanceId, market || strip);
        }
      }}
      className="border-t border-border/50 pt-3"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-1 text-left text-xs font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground">
        <span>{t('pause.reflect.marketContextTitle', { defaultValue: 'Market context' })}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {market ? (
          <p className="text-xs font-mono leading-relaxed text-muted-foreground">{market}</p>
        ) : null}
        {strip ? <p className="text-sm leading-relaxed text-muted-foreground">{strip}</p> : null}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('pause.reflect.contextStripDisclaimer', {
            defaultValue: 'Common narratives, not financial advice.',
          })}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
