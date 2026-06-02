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
  footnote,
  isLoading,
  to,
}: {
  label: string;
  value: number | null;
  footnote: string;
  isLoading: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[108px] flex-col rounded-lg border border-border/40 bg-card/40 p-4 transition-colors hover:border-border/60 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className={cn(homeInWidget.kicker, 'text-[10px] tracking-widest')}>{label}</p>
      {isLoading ? (
        <Skeleton className="mt-3 h-12 w-16" />
      ) : (
        <p className="mt-2 text-[3rem] font-normal tabular-nums leading-none tracking-tight text-foreground">
          {value ?? 0}
        </p>
      )}
      <p className="mt-auto text-xs leading-snug text-muted-foreground">{footnote}</p>
    </Link>
  );
}

/** Presence + Pauses glimpse (Wireframes 546:8986) — taps through to Journey drill-down. */
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
        footnote={t('home.practiceStats.presenceFootnote', {
          defaultValue: 'Lifetime XP · see Journey',
        })}
        isLoading={isLoading}
      />
      <StatTile
        to="/journey"
        label={t('home.practiceStats.pauses', { defaultValue: 'Pauses' })}
        value={completedPauseCount}
        footnote={t('home.practiceStats.pausesFootnote', {
          defaultValue: 'Completed · see Journey',
        })}
        isLoading={isLoading}
      />
    </div>
  );
}
