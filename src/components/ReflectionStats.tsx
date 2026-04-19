import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Shield, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  reflections: { created_at: string; outcome: string | null; breathing_completed?: boolean | null; mood?: string | null; mood_after?: string | null }[];
  streakFreezeDates?: string[];
  onUseFreeze?: () => Promise<void>;
}

export function ReflectionStats({ reflections, streakFreezeDates = [], onUseFreeze }: Props) {
  const { t } = useTranslation();
  const [freezing, setFreezing] = useState(false);

  const { total, currentStreak, longestStreak, streakAtRisk, canFreeze, nextFreezeAvailable } = useMemo(() => {
    if (reflections.length === 0) return { total: 0, currentStreak: 0, longestStreak: 0, streakAtRisk: false, canFreeze: false, nextFreezeAvailable: null };

    // Only count engaged pauses (breathing + mood + mood_after + outcome) for all metrics
    const withOutcome = reflections.filter(
      (r) => r.breathing_completed && r.mood && r.mood_after && r.outcome
    );
    const totalCompleted = withOutcome.length;

    if (totalCompleted === 0) return { total: 0, currentStreak: 0, longestStreak: 0, streakAtRisk: false, canFreeze: false, nextFreezeAvailable: null };

    const days = new Set<string>();
    for (const r of withOutcome) {
      days.add(parseISO(r.created_at).toISOString().slice(0, 10));
    }
    const realDays = new Set(days);
    for (const d of streakFreezeDates) {
      days.add(d);
    }
    const sorted = Array.from(days).sort().reverse();

    const today = new Date().toISOString().slice(0, 10);
    let current = 0;
    const startDay = sorted[0];
    const daysSinceLastOutcome = differenceInCalendarDays(new Date(today), new Date(startDay));

    if (daysSinceLastOutcome <= 1) {
      current = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
        if (diff === 1) current++;
        else break;
      }
    }

    let longest = 1;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
      if (diff === 1) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        streak = 1;
      }
    }

    const hasReflectionToday = realDays.has(today);
    const hasFreezeToday = streakFreezeDates.includes(today);
    const atRisk = current >= 2 && !hasReflectionToday && !hasFreezeToday;

    const recentFreezes = streakFreezeDates.filter((d) => {
      const diff = Math.abs(Date.now() - new Date(d).getTime());
      return diff < 7 * 24 * 60 * 60 * 1000;
    });
    const freezeAvailable = recentFreezes.length < 1;

    let nextFreezeAvailable: string | null = null;
    if (!freezeAvailable && recentFreezes.length > 0) {
      const latestFreeze = recentFreezes.sort().reverse()[0];
      const nextDate = new Date(new Date(latestFreeze).getTime() + 7 * 24 * 60 * 60 * 1000);
      nextFreezeAvailable = formatDistanceToNow(nextDate, { addSuffix: true });
    }

    return { total: totalCompleted, currentStreak: current, longestStreak: longest, streakAtRisk: atRisk, canFreeze: freezeAvailable, nextFreezeAvailable };
  }, [reflections, streakFreezeDates]);

  const handleFreeze = async () => {
    if (!onUseFreeze) return;
    setFreezing(true);
    try {
      await onUseFreeze();
      toast(t('stats.streakFreezeActivated'));
    } catch {
      toast(t('stats.failedFreeze'));
    } finally {
      setFreezing(false);
    }
  };

  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t('stats.reflections')} value={total} />
        <StatCard label={t('stats.outcomeStreak')} value={currentStreak} suffix="d" />
        <StatCard label={t('stats.bestStreak')} value={longestStreak} suffix="d" />
      </div>

      {streakAtRisk && canFreeze && onUseFreeze && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFreeze}
          disabled={freezing}
          className="w-full font-mono text-xs gap-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          <Shield className="h-3.5 w-3.5" />
          {freezing ? t('stats.activating') : t('stats.useStreakFreeze')}
        </Button>
      )}

      {onUseFreeze && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
            <Snowflake className="h-3 w-3" />
            {canFreeze ? (
              <span>{t('stats.freezeAvailable')}</span>
            ) : (
              <span>{t('stats.nextFreeze', { time: nextFreezeAvailable })}</span>
            )}
          </div>

          {streakFreezeDates.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-muted-foreground/40">{t('stats.used')}:</span>
              {[...streakFreezeDates].sort().reverse().slice(0, 5).map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-mono text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded"
                >
                  {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              ))}
              {streakFreezeDates.length > 5 && (
                <span className="text-[10px] font-mono text-muted-foreground/30">
                  {t('stats.more', { count: streakFreezeDates.length - 5 })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-3 text-center space-y-1">
      <p className="text-2xl font-mono tracking-tight">
        {value}{suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </p>
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{label}</p>
    </div>
  );
}
