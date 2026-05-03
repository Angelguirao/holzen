import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHolzen } from '@/hooks/use-holzen';
import { useCompletedPauseCount } from '@/hooks/use-completed-pause-count';
import { settingsSectionPath, TOOLS } from '@/lib/app-routes';
import { groundingActivityLabel } from '@/lib/grounding-activity-label';

/**
 * “So you” — shows **grounding activities** from `profiles.grounding_activities`
 * (same list as Settings → You and the Ground tool). Edit only in Settings.
 */
export function ToolsYourActivitiesSection() {
  const { t } = useTranslation();
  const { groundingActivities, profileLoaded, mantra } = useHolzen();
  const completedPauseCount = useCompletedPauseCount();
  const settingsYou = settingsSectionPath('you');
  const mantraEmpty = !mantra?.trim();
  const showMantraSuggestion =
    profileLoaded &&
    mantraEmpty &&
    completedPauseCount !== null &&
    completedPauseCount >= 1;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-foreground">{t('tools.hub.soYou')}</h2>

      {showMantraSuggestion ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-nox-text-highlight/80" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
              {t('tools.hub.goodNextStep')}
            </p>
            <p className="text-sm leading-snug text-foreground">{t('tools.hub.mantraEmptyTitle')}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t('tools.hub.mantraEmptyBody')}</p>
            <Link
              to={settingsYou}
              className="inline-flex pt-1 text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
            >
              {t('tools.hub.mantraEmptyCta')}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {t('tools.hub.yourGroundingActivities')}
          </p>
          <Link
            to={settingsYou}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label={t('tools.hub.editGroundingInSettings')}
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-2 text-sm leading-snug text-muted-foreground">{t('tools.hub.groundingActivitiesIntro')}</p>

        {!profileLoaded ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        ) : groundingActivities.length === 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground/90 leading-relaxed">{t('tools.hub.noGroundingActivities')}</p>
            <Link
              to={settingsYou}
              className="inline-flex text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
            >
              {t('tools.hub.addGroundingInSettings')}
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {groundingActivities.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 font-normal">
                {groundingActivityLabel(tag, t)}
              </Badge>
            ))}
          </div>
        )}

        {profileLoaded && groundingActivities.length > 0 ? (
          <div className="mt-4 border-t border-border/40 pt-3">
            <Link
              to={TOOLS.ground}
              className="text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
            >
              {t('tools.hub.openGround')}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
