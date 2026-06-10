import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  trackPauseReflectContextStripExpanded,
  type CurrentFeelForReflect,
  type ReflectionContentV2,
} from '@/features/pause/public-ritual-reflect';

export type PauseReflectBlocksProps = {
  pauseInstanceId: string | null;
  context: string | null;
  content: ReflectionContentV2;
  currentFeel?: CurrentFeelForReflect;
};

function moodDisplayLabel(mood: string, t: (key: string, opts?: { defaultValue?: string }) => string): string {
  const key = `moodCheck.moods.${mood}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) return translated;
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

/** Structured Reflect copy: Land, Name it, optional context strip. */
export function PauseReflectBlocks({
  pauseInstanceId,
  context,
  content,
  currentFeel,
}: PauseReflectBlocksProps) {
  "use memo";
  const { t } = useTranslation();
  const [contextOpen, setContextOpen] = useState(false);

  const mood = currentFeel?.mood ?? '';
  const intensity = currentFeel?.intensity;
  const tileLabel = currentFeel?.tileLabel?.trim();

  const feelRecap =
    mood && typeof intensity === 'number'
      ? t('pause.reflect.feelRecap', {
          defaultValue: 'You said: {{mood}} ({{intensity}}/5)',
          mood: moodDisplayLabel(mood, t),
          intensity,
        })
      : mood
        ? t('pause.reflect.feelRecapNoIntensity', {
            defaultValue: 'You said: {{mood}}',
            mood: moodDisplayLabel(mood, t),
          })
        : null;

  const contextStrip = content.contextStrip?.trim();
  const showContextStrip = Boolean(contextStrip || context?.trim());

  return (
    <div className="space-y-5">
      {content.land.trim() ? (
        <section aria-labelledby="pause-reflect-land">
          <h3 id="pause-reflect-land" className="sr-only">
            {t('pause.reflect.landLabel', { defaultValue: 'Land' })}
          </h3>
          <p className="font-editorial text-base leading-relaxed text-foreground sm:text-lg">
            {content.land.trim()}
          </p>
        </section>
      ) : null}

      {(feelRecap || content.hypothesis.trim() || content.inquiry.trim()) ? (
        <section aria-labelledby="pause-reflect-name-it" className="space-y-2 border-t border-border/60 pt-4">
          <h3
            id="pause-reflect-name-it"
            className="text-xs font-mono uppercase tracking-wide text-muted-foreground"
          >
            {t('pause.reflect.nameItTitle', { defaultValue: 'Name it' })}
          </h3>
          {feelRecap ? (
            <p className="text-sm leading-relaxed text-foreground">{feelRecap}</p>
          ) : null}
          {tileLabel ? (
            <p className="text-sm text-muted-foreground">
              {t('pause.reflect.feelTile', { defaultValue: '“{{tile}}”', tile: tileLabel })}
            </p>
          ) : null}
          {content.hypothesis.trim() ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {t('pause.reflect.hypothesisLabel', { defaultValue: 'What might be underneath' })}
              </p>
              <p className="text-sm leading-relaxed text-foreground">{content.hypothesis.trim()}</p>
            </div>
          ) : null}
          {content.inquiry.trim() ? (
            <p className="font-editorial text-base font-medium leading-relaxed text-foreground sm:text-lg">
              {content.inquiry.trim()}
            </p>
          ) : null}
        </section>
      ) : null}

      {showContextStrip ? (
        <Collapsible
          open={contextOpen}
          onOpenChange={(open) => {
            setContextOpen(open);
            if (open) {
              trackPauseReflectContextStripExpanded(pauseInstanceId, context);
            }
          }}
          className="border-t border-border/60 pt-3"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-1 text-left text-xs font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground">
            <span>{t('pause.reflect.contextStripTitle', { defaultValue: 'Why might markets move?' })}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${contextOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {context?.trim() ? (
              <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{context.trim()}</p>
            ) : null}
            {contextStrip ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{contextStrip}</p>
            ) : null}
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('pause.reflect.contextStripDisclaimer', {
                defaultValue: 'Common narratives, not financial advice.',
              })}
            </p>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
