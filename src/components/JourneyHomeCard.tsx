import { Link } from 'react-router-dom';
import { ChevronRight, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { journeyPath } from '@/lib/app-routes';

/**
 * Compact entry to **Journey** (stats hub) from Home — §4.2 / §4.7 “stats on Home” lite.
 */
export function JourneyHomeCard() {
  const { t } = useTranslation();

  return (
    <Link
      to={journeyPath('stats')}
      className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3 transition-colors hover:bg-muted/30"
    >
      <Route className="h-4 w-4 shrink-0 text-secondary-foreground mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium text-foreground">
          {t('journey.homeCardTitle', { defaultValue: 'Your journey' })}
        </p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
          {t('journey.homeCardSubtitle', {
            defaultValue: 'Stats, insights, badges, and activity',
          })}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" aria-hidden />
    </Link>
  );
}
