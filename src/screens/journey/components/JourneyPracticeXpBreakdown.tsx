import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildPracticeXpSignalRows,
  type PracticeXpBySignal,
  type PracticeXpSignalKey,
} from '@/features/pause/domain/practice/practice-xp-by-signal';

interface JourneyPracticeXpBreakdownProps {
  xpBySignal: PracticeXpBySignal;
  presenceXpTotal: number;
  isLoading: boolean;
}

function signalLabelKey(key: PracticeXpSignalKey): string {
  return `journey.overview.presence.signals.${key}`;
}

export function JourneyPracticeXpBreakdown({
  xpBySignal,
  presenceXpTotal,
  isLoading,
}: JourneyPracticeXpBreakdownProps) {
  "use memo";
  const { t } = useTranslation();

  const rows = useMemo(
    () => buildPracticeXpSignalRows(xpBySignal, presenceXpTotal),
    [xpBySignal, presenceXpTotal],
  );

  if (!isLoading && rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-border/30 pt-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('journey.overview.presence.breakdownTitle', {
            defaultValue: 'Where your XP came from',
          })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('journey.overview.presence.breakdownDesc', {
            defaultValue: 'Lifetime bonus XP by ritual signal (every completed pause includes base XP).',
          })}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : (
        <ul className="space-y-3" aria-label={t('journey.overview.presence.breakdownAria', { defaultValue: 'Presence XP by signal' })}>
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-foreground">
                  {t(signalLabelKey(row.key), { defaultValue: row.key })}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {t('journey.overview.presence.signalXp', {
                    defaultValue: '{{xp}} XP',
                    xp: row.xp,
                  })}
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/50"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-primary/70 transition-[width]"
                  style={{ width: `${Math.max(row.sharePercent, 4)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
