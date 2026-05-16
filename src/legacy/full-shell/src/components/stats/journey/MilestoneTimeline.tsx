import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Sparkles, Flame, Shield, Target, Feather } from 'lucide-react';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
import { effectivePauseShiftMood } from '@/lib/pause-effective-emotion';

interface Props {
  rows: readonly PauseFullRow[];
}

interface Milestone {
  key: string;
  label: string;
  at: string;
  icon: typeof Sparkles;
}

function first<T extends PauseFullRow>(rows: readonly T[], predicate: (r: T) => boolean): T | null {
  const match = [...rows]
    .filter(predicate)
    .sort((a, b) =>
      (a.completed_at ?? a.engaged_at ?? a.created_at).localeCompare(
        b.completed_at ?? b.engaged_at ?? b.created_at,
      ),
    );
  return match[0] ?? null;
}

/**
 * Journey deep dive: chronological milestone timeline — first pause,
 * first completed, first calm exit, first hold, pause-count thresholds.
 */
export function MilestoneTimeline({ rows }: Props) {
  const { t } = useTranslation();

  const milestones = useMemo<Milestone[]>(() => {
    const out: Milestone[] = [];
    const firstCreated = first(rows, () => true);
    if (firstCreated) {
      out.push({
        key: 'first-pause',
        label: t('stats.journey.milestones.firstPause', { defaultValue: 'First pause' }),
        at: firstCreated.created_at,
        icon: Sparkles,
      });
    }
    const firstCompleted = first(rows, (r) => r.state === 'completed');
    if (firstCompleted) {
      out.push({
        key: 'first-completed',
        label: t('stats.journey.milestones.firstCompleted', { defaultValue: 'First completed' }),
        at: firstCompleted.completed_at ?? firstCompleted.engaged_at ?? firstCompleted.created_at,
        icon: Flame,
      });
    }
    const firstCalmExit = first(rows, (r) => {
      if (r.state !== 'completed') return false;
      const m = effectivePauseShiftMood(r);
      return m === 'calm' || m === 'detached';
    });
    if (firstCalmExit) {
      out.push({
        key: 'first-calm-exit',
        label: t('stats.journey.milestones.firstCalmExit', { defaultValue: 'First calm exit' }),
        at: firstCalmExit.completed_at ?? firstCalmExit.created_at,
        icon: Shield,
      });
    }
    const firstHold = first(
      rows,
      (r) => r.state === 'completed' && r.outcome === 'held',
    );
    if (firstHold) {
      out.push({
        key: 'first-hold',
        label: t('stats.journey.milestones.firstHold', { defaultValue: 'First hold under pressure' }),
        at: firstHold.completed_at ?? firstHold.created_at,
        icon: Target,
      });
    }

    const completedCount = rows.filter((r) => r.state === 'completed').length;
    const thresholds = [5, 10, 25, 50, 100, 250, 500];
    for (const t of thresholds) {
      if (completedCount >= t) {
        const sorted = [...rows]
          .filter((r) => r.state === 'completed')
          .sort((a, b) => (a.completed_at ?? '').localeCompare(b.completed_at ?? ''));
        const hit = sorted[t - 1];
        if (hit) {
          out.push({
            key: `count-${t}`,
            label: t === 500
              ? (undefined as unknown as string)
              : `${t} completed pauses`,
            at: hit.completed_at ?? hit.created_at,
            icon: Feather,
          });
        }
      }
    }

    return out
      .filter((m) => typeof m.label === 'string' && m.label.length > 0)
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [rows, t]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <p className="pb-3 text-xs font-semibold uppercase tracking-widest text-foreground">
        {t('stats.journey.milestones.title', { defaultValue: 'Milestones' })}
      </p>
      {milestones.length === 0 ? (
        <p className="py-4 text-xs italic text-muted-foreground">
          {t('stats.journey.milestones.empty', {
            defaultValue: 'Complete your first pause to start your milestone timeline.',
          })}
        </p>
      ) : (
        <ul className="space-y-2">
          {milestones.map((m) => (
            <li key={m.key} className="flex items-center gap-2">
              <m.icon className="h-3.5 w-3.5 shrink-0 text-nox-text-highlight" aria-hidden />
              <span className="flex-1 text-sm text-foreground">{m.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {format(new Date(m.at), 'MMM d, yyyy')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
