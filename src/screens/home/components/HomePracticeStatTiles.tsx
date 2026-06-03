import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

interface HomePracticeStatTilesProps {
  presenceXp: number | null;
  completedPauseCount: number | null;
  isLoading: boolean;
}

function StatTile({
  label,
  value,
  unit,
  isLoading,
  to,
}: {
  label: string;
  value: number | null;
  unit: string;
  isLoading: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[96px] flex-col rounded-lg border border-border/40 bg-card/40 p-4 transition-colors hover:border-border/60 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className={cn(homeInWidget.kicker, 'text-[10px] tracking-widest')}>{label}</p>
      <div className="mt-2 flex flex-1 items-end">
        {isLoading ? (
          <Skeleton className="h-12 w-20" />
        ) : (
          <div className="flex items-end gap-1.5">
            <span className="text-[3rem] font-normal tabular-nums leading-none tracking-tight text-foreground">
              {value ?? 0}
            </span>
            <span className="mb-1.5 text-xs font-normal leading-none text-muted-foreground">{unit}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/** Presence + completed-count glimpse — entire tile links to Journey. */
export function HomePracticeStatTiles({
  presenceXp,
  completedPauseCount,
  isLoading,
}: HomePracticeStatTilesProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile
        to="/journey"
        label={t('home.practiceStats.presence', { defaultValue: 'Presence' })}
        value={presenceXp}
        unit={t('home.practiceStats.presenceUnit', {
          defaultValue: 'XP',
        })}
        isLoading={isLoading}
      />
      <StatTile
        to="/journey"
        label={t('home.practiceStats.pauses', { defaultValue: 'Completed' })}
        value={completedPauseCount}
        unit={t('home.practiceStats.pausesUnit', {
          defaultValue: 'Pauses',
        })}
        isLoading={isLoading}
      />
    </div>
  );
}
