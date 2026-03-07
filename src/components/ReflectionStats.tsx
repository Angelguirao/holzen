import { useMemo } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface Props {
  reflections: { created_at: string }[];
}

export function ReflectionStats({ reflections }: Props) {
  const { total, currentStreak, longestStreak } = useMemo(() => {
    if (reflections.length === 0) return { total: 0, currentStreak: 0, longestStreak: 0 };

    // Get unique days (sorted newest first)
    const days = new Set<string>();
    for (const r of reflections) {
      days.add(parseISO(r.created_at).toISOString().slice(0, 10));
    }
    const sorted = Array.from(days).sort().reverse(); // newest first

    // Current streak: count consecutive days from today/yesterday
    const today = new Date().toISOString().slice(0, 10);
    let current = 0;
    const startDay = sorted[0];
    const daysSinceLastReflection = differenceInCalendarDays(new Date(today), new Date(startDay));

    if (daysSinceLastReflection <= 1) {
      current = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
        if (diff === 1) current++;
        else break;
      }
    }

    // Longest streak
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

    return { total: reflections.length, currentStreak: current, longestStreak: longest };
  }, [reflections]);

  if (total === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Total" value={total} />
      <StatCard label="Streak" value={currentStreak} suffix="d" />
      <StatCard label="Best" value={longestStreak} suffix="d" />
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
