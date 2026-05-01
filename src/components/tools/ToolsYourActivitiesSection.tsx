import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHolzen } from '@/hooks/use-holzen';
import { settingsSectionPath, TOOLS } from '@/lib/app-routes';
import { groundingActivityLabel } from '@/lib/grounding-activity-label';

/**
 * “So you” — shows **grounding activities** from `profiles.grounding_activities`
 * (same list as Settings → You and the Ground tool). Edit only in Settings.
 */
export function ToolsYourActivitiesSection() {
  const { t } = useTranslation();
  const { groundingActivities, profileLoaded } = useHolzen();
  const settingsYou = settingsSectionPath('you');

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-foreground">{t('tools.hub.soYou')}</h2>

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
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
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
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('tools.hub.openGround')}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
