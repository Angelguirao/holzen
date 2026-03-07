import { useMemo, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Shield, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  reflections: { created_at: string; outcome: string | null }[];
  streakFreezeDates?: string[];
  onUseFreeze?: () => Promise<void>;
}

export function ReflectionStats({ reflections, streakFreezeDates = [], onUseFreeze }: Props) {
  const [freezing, setFreezing] = useState(false);

  const { total, currentStreak, longestStreak, streakAtRisk, canFreeze } = useMemo(() => {
    if (reflections.length === 0) return { total: 0, currentStreak: 0, longestStreak: 0, streakAtRisk: false, canFreeze: false };

    const withOutcome = reflections.filter(r => r.outcome != null && r.outcome !== '');
    const totalOutcomes = withOutcome.length;

    if (totalOutcomes === 0) return { total: reflections.length, currentStreak: 0, longestStreak: 0, streakAtRisk: false, canFreeze: false };

    // Get unique days with outcomes + freeze dates
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

    // Streak at risk: user had a streak ≥2, no reflection today, and last real reflection was yesterday
    const hasReflectionToday = realDays.has(today);
    const hasFreezeToday = streakFreezeDates.includes(today);
    const atRisk = current >= 2 && !hasReflectionToday && !hasFreezeToday;

    // Can freeze: no freeze used in last 7 days
    const recentFreezes = streakFreezeDates.filter((d) => {
      const diff = Math.abs(Date.now() - new Date(d).getTime());
      return diff < 7 * 24 * 60 * 60 * 1000;
    });
    const freezeAvailable = recentFreezes.length < 1;

    // Next freeze available date
    let nextFreezeAvailable: string | null = null;
    if (!freezeAvailable && recentFreezes.length > 0) {
      const latestFreeze = recentFreezes.sort().reverse()[0];
      const nextDate = new Date(new Date(latestFreeze).getTime() + 7 * 24 * 60 * 60 * 1000);
      nextFreezeAvailable = formatDistanceToNow(nextDate, { addSuffix: true });
    }

    return { total: reflections.length, currentStreak: current, longestStreak: longest, streakAtRisk: atRisk, canFreeze: freezeAvailable, nextFreezeAvailable };
  }, [reflections, streakFreezeDates]);

  const handleFreeze = async () => {
    if (!onUseFreeze) return;
    setFreezing(true);
    try {
      await onUseFreeze();
      toast('Streak freeze activated for today');
    } catch {
      toast('Failed to activate freeze');
    } finally {
      setFreezing(false);
    }
  };

  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Reflections" value={total} />
        <StatCard label="Outcome streak" value={currentStreak} suffix="d" />
        <StatCard label="Best streak" value={longestStreak} suffix="d" />
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
          {freezing ? 'Activating…' : 'Use streak freeze — protect your streak today'}
        </Button>
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
