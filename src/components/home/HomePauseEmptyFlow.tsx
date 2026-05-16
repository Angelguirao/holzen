import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Sparkles } from 'lucide-react';
import { AutoCooldownIndicator, NeedAMomentButton } from '@/components/home/HomePauseChrome';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { useToolsHubData } from '@/hooks/use-tools-hub-data';
import { useProGate } from '@/hooks/use-pro-gate';
import { cn } from '@/lib/utils';
import {
  TOOLS_PRACTICE_SUGGESTION_LABEL_KEY,
  TOOLS_PRACTICE_SUGGESTION_ROUTE,
  isToolsPracticeFree,
  visibleToolsPracticeSuggestions,
} from '@/lib/tools-hub-practice-suggestions';
import { TOOLS } from '@/lib/app-routes';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  onNeedPause: () => void;
  manualCooldownRemaining: () => number;
  pauseLoading: boolean;
  /** Zen mode centers the stack */
  variant?: 'default' | 'zen';
};

/**
 * Empty “Your pause” stack: reassurance → market watch / schedule → same next-step
 * logic as Tools hub → manual pause.
 */
export function HomePauseEmptyFlow({
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  onNeedPause,
  manualCooldownRemaining,
  pauseLoading,
  variant = 'default',
}: Props) {
  const { t } = useTranslation();
  const { lastCheckIn, suggestions, loading: hubLoading } = useToolsHubData();
  const { isPro, requirePro } = useProGate();
  const visible = visibleToolsPracticeSuggestions(suggestions, isPro);
  const primary = visible[0] ?? null;

  const zen = variant === 'zen';

  return (
    <div className={cn('space-y-4', zen && 'text-center')}>
      <p className={cn(homeInWidget.bodyMuted, 'leading-relaxed', zen && 'mx-auto max-w-sm')}>
        {t('home.pauseEmpty.statusLine')}
      </p>

      {showPauseScheduling ? (
        <div
          className={cn(
            'rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5',
            zen && 'mx-auto max-w-sm text-left',
          )}
        >
          <AutoCooldownIndicator
            cooldownRemaining={autoCooldownRemaining}
            cooldownHours={cooldownHours}
            nextCronCheckIn={nextCronCheckIn}
          />
        </div>
      ) : null}

      <div className={zen ? 'flex flex-col items-center' : undefined}>
        {hubLoading ? (
          <Skeleton className={zen ? 'h-14 w-full max-w-sm' : 'h-14 w-full rounded-xl'} aria-busy="true" />
        ) : primary ? (
          <Link
            to={TOOLS_PRACTICE_SUGGESTION_ROUTE[primary.id]}
            onClick={(e) => {
              const gated = !isToolsPracticeFree(primary.id) && !isPro;
              if (!gated) return;
              e.preventDefault();
              requirePro(primary.id);
            }}
            className={cn(
              'flex w-full max-w-md items-start gap-2 rounded-xl border border-border/50 bg-nox-background-accent/20 px-3 py-2.5 text-left transition-colors hover:bg-nox-background-accent/35',
              zen && 'mx-auto',
            )}
          >
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nox-text-highlight" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={cn(homeInWidget.kicker, 'text-nox-text-highlight/90')}>{t('tools.hub.suggestedPill')}</p>
              <p className="text-sm font-medium text-foreground">{t(TOOLS_PRACTICE_SUGGESTION_LABEL_KEY[primary.id])}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(primary.reasonKey)}</p>
            </div>
            <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          </Link>
        ) : lastCheckIn ? (
          <Link
            to={TOOLS.practice.checkin}
            className={cn(
              'flex w-full max-w-md items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 text-sm transition-colors hover:bg-muted/30',
              zen && 'mx-auto',
            )}
          >
            <span className="min-w-0 text-left font-medium text-foreground">{t('tools.hub.lastCheckIn')}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ) : (
          <Link
            to={TOOLS.practice.checkin}
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline',
              zen && 'mx-auto',
            )}
          >
            {t('tools.hub.logCheckInCta')}
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        )}
      </div>

      <div className={cn('border-t border-border/40 pt-3', zen && 'mx-auto w-full max-w-sm')}>
        <NeedAMomentButton
          onTrigger={onNeedPause}
          cooldownRemaining={manualCooldownRemaining}
          loading={pauseLoading}
        />
      </div>
    </div>
  );
}
