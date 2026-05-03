import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProGate } from '@/hooks/use-pro-gate';
import { TOOLS } from '@/lib/app-routes';
import type { LastCheckInRow } from '@/hooks/use-tools-hub-data';
import type { PracticeSuggestion } from '@/lib/practice-suggestion';
import {
  TOOLS_PRACTICE_SUGGESTION_LABEL_KEY,
  TOOLS_PRACTICE_SUGGESTION_ROUTE,
  isToolsPracticeFree,
  visibleToolsPracticeSuggestions,
} from '@/lib/tools-hub-practice-suggestions';

type Props = {
  loading: boolean;
  lastCheckIn: LastCheckInRow | null;
  suggestions: PracticeSuggestion[];
};

export function ToolsGoodNextStepSection({ loading, lastCheckIn, suggestions }: Props) {
  const { t } = useTranslation();
  const { isPro, requirePro } = useProGate();

  const visibleSuggestions = visibleToolsPracticeSuggestions(suggestions, isPro);

  const formatTrigger = (text: string | null) => {
    if (!text?.trim()) return null;
    const s = text.trim();
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  };

  if (loading) {
    return (
      <section className="space-y-3" aria-busy="true">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-foreground">{t('tools.hub.goodNextStep')}</h2>

      {visibleSuggestions.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {visibleSuggestions.map((s) => {
            const gated = !isToolsPracticeFree(s.id) && !isPro;
            return (
              <Link
                key={s.id}
                to={TOOLS_PRACTICE_SUGGESTION_ROUTE[s.id]}
                onClick={(e) => {
                  if (!gated) return;
                  e.preventDefault();
                  requirePro(s.id);
                }}
                className="flex flex-1 min-w-0 items-start gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-primary/[0.07] sm:min-w-[140px] sm:flex-initial"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-primary/90">
                    {t('tools.hub.suggestedPill')}
                  </p>
                  <p className="text-sm font-medium text-foreground">{t(TOOLS_PRACTICE_SUGGESTION_LABEL_KEY[s.id])}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(s.reasonKey)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {lastCheckIn ? (
        <Link
          to={TOOLS.practice.checkin}
          className="block rounded-xl border border-border/50 bg-muted/15 p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {t('tools.hub.lastCheckIn')}
            </p>
            <Pencil className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />
          </div>
          <div className="mt-2 flex items-start gap-2">
            {lastCheckIn.mood ? (
              <Badge variant="secondary" className="shrink-0 font-normal">
                {t(`moodCheck.moods.${lastCheckIn.mood}`, { defaultValue: lastCheckIn.mood })}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">{t('tools.hub.checkinNoMood')}</span>
            )}
            {typeof lastCheckIn.intensity === 'number' ? (
              <span className="text-xs text-muted-foreground">
                {t('tools.hub.intensityShort', { n: lastCheckIn.intensity })}
              </span>
            ) : null}
          </div>
          {formatTrigger(lastCheckIn.trigger_text) ? (
            <p className="mt-2 text-sm leading-snug text-foreground/90">{formatTrigger(lastCheckIn.trigger_text)}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t('tools.hub.checkinTapToUpdate')}
          </p>
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{t('tools.hub.noCheckInYet')}</p>
          <Link
            to={TOOLS.practice.checkin}
            className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('tools.hub.logCheckInCta')}
          </Link>
        </div>
      )}
    </section>
  );
}
