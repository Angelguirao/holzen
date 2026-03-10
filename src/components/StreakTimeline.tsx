import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, subDays, format } from 'date-fns';

interface Props {
  reflections: { created_at: string; outcome: string | null }[];
  practiceEntries?: { created_at: string; type: string }[];
  streakFreezeDates?: string[];
  memberSince?: string | null;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export function StreakTimeline({ reflections, practiceEntries = [], streakFreezeDates = [], memberSince }: Props) {
  const { t } = useTranslation();

  const { days, currentStreak, longestStreak, nextMilestone } = useMemo(() => {
    const today = new Date();
    const dayCount = 28;
    const memberStart = memberSince ? new Date(memberSince).toISOString().slice(0, 10) : null;
    const dayMap = new Map<string, 'outcome' | 'reflection' | 'practice' | 'freeze' | 'empty' | 'pre'>();

    for (let i = 0; i < dayCount; i++) {
      const d = subDays(today, i).toISOString().slice(0, 10);
      if (memberStart && d < memberStart) {
        dayMap.set(d, 'pre');
      } else {
        dayMap.set(d, streakFreezeDates.includes(d) ? 'freeze' : 'empty');
      }
    }

    // Mark practice-only days first (lower priority)
    for (const p of practiceEntries) {
      const d = new Date(p.created_at).toISOString().slice(0, 10);
      if (dayMap.has(d) && dayMap.get(d) === 'empty') {
        dayMap.set(d, 'practice');
      }
    }

    // Reflections override practice status
    for (const r of reflections) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      if (dayMap.has(d)) {
        const current = dayMap.get(d);
        if (current === 'empty' || current === 'practice') {
          dayMap.set(d, r.outcome ? 'outcome' : 'reflection');
        } else if (current === 'reflection' && r.outcome) {
          dayMap.set(d, 'outcome');
        }
      }
    }

    // Compute streaks: outcome days + freeze days + practice days all count
    const allDays = new Set<string>();
    for (const r of reflections) {
      if (r.outcome) allDays.add(new Date(r.created_at).toISOString().slice(0, 10));
    }
    for (const p of practiceEntries) {
      allDays.add(new Date(p.created_at).toISOString().slice(0, 10));
    }
    for (const d of streakFreezeDates) allDays.add(d);
    const sorted = Array.from(allDays).sort().reverse();

    let current = 0;
    if (sorted.length > 0) {
      const todayStr = today.toISOString().slice(0, 10);
      const gap = differenceInCalendarDays(new Date(todayStr), new Date(sorted[0]));
      if (gap <= 1) {
        current = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
          if (diff === 1) current++;
          else break;
        }
      }
    }

    let longest = 0;
    if (sorted.length > 0) {
      let s = 1;
      longest = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
        if (diff === 1) { s++; longest = Math.max(longest, s); }
        else s = 1;
      }
    }

    const nextMilestone = STREAK_MILESTONES.find((m) => m > current) ?? null;

    const days = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, status]) => ({ date, status }));

    return { days, currentStreak: current, longestStreak: longest, nextMilestone };
  }, [reflections, practiceEntries, streakFreezeDates, memberSince]);

  if (reflections.length === 0 && practiceEntries.length === 0) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          {t('streakTimeline.title')}
        </p>
        {nextMilestone && currentStreak > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground/60">
            {t('streakTimeline.daysToMilestone', { days: nextMilestone - currentStreak, milestone: nextMilestone })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, status }) => {
          const isToday = date === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={date}
              title={`${format(new Date(date), 'MMM d')} — ${status === 'pre' ? t('streakTimeline.beforeSignup') : t(`streakTimeline.status.${status}`)}`}
              className={`aspect-square rounded-sm transition-colors ${
                status === 'outcome'
                  ? 'bg-primary'
                  : status === 'reflection'
                    ? 'bg-primary/30'
                    : status === 'practice'
                      ? 'bg-accent-foreground/20'
                      : status === 'freeze'
                        ? 'bg-blue-400/40'
                        : status === 'pre'
                          ? 'bg-transparent border border-border/20'
                          : 'bg-muted/50'
              } ${isToday ? 'ring-1 ring-foreground/20' : ''}`}
            />
          );
        })}
      </div>

      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono text-muted-foreground/50">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary" /> {t('streakTimeline.legend.outcomeLogged')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary/30" /> {t('streakTimeline.legend.reflectedNoOutcome')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-accent-foreground/20" /> {t('streakTimeline.legend.practiceOnly', 'Practice only')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-blue-400/40" /> {t('streakTimeline.legend.streakFreeze')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-muted/50" /> {t('streakTimeline.legend.noActivity')}
        </span>
      </div>

      {currentStreak > 0 && nextMilestone && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>{t('streakTimeline.streakDays', { days: currentStreak })}</span>
            <span>{t('streakTimeline.milestoneDays', { days: nextMilestone })}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out"
              style={{ width: `${Math.min((currentStreak / nextMilestone) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
