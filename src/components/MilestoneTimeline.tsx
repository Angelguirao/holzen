import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, format } from 'date-fns';
import { Flag, Star, Flame, Shield, Heart, Zap, Mail, Scroll } from 'lucide-react';

interface Reflection {
  created_at: string;
  mood: string | null;
  mood_after: string | null;
  outcome: string | null;
}

interface PracticeEntry {
  created_at: string;
  type: string;
}

interface LetterEntry {
  written_at: string;
  delivered: boolean;
  delivered_at: string | null;
}

interface Props {
  reflections: Reflection[];
  practiceEntries?: PracticeEntry[];
  letters?: LetterEntry[];
  memberSince?: string | null;
}

interface Milestone {
  date: string;
  icon: typeof Flag;
  label: string;
  detail: string;
}

const COMPOSURE_MOODS = ['calm', 'detached'];

export function MilestoneTimeline({ reflections, practiceEntries = [], letters = [], memberSince }: Props) {
  const { t } = useTranslation();

  const milestones = useMemo(() => {
    const items: Milestone[] = [];
    const sorted = [...reflections].sort((a, b) => a.created_at.localeCompare(b.created_at));

    // 1. First pause
    if (sorted.length >= 1) {
      items.push({
        date: sorted[0].created_at,
        icon: Flag,
        label: t('milestones.firstPause', 'First pause'),
        detail: format(new Date(sorted[0].created_at), 'MMM d, yyyy'),
      });
    }

    // 2. First calm outcome
    const firstCalm = sorted.find(
      (r) => r.mood_after && COMPOSURE_MOODS.includes(r.mood_after)
    );
    if (firstCalm) {
      items.push({
        date: firstCalm.created_at,
        icon: Heart,
        label: t('milestones.firstCalm', 'First calm exit'),
        detail: format(new Date(firstCalm.created_at), 'MMM d'),
      });
    }

    // 3. First hold
    const firstHold = sorted.find((r) => r.outcome === 'held' || r.outcome === 'nothing');
    if (firstHold) {
      items.push({
        date: firstHold.created_at,
        icon: Shield,
        label: t('milestones.firstHold', 'First hold'),
        detail: format(new Date(firstHold.created_at), 'MMM d'),
      });
    }

    // 4. Highest pause count milestone only
    const countMilestones = [5, 10, 25, 50, 100, 250, 500];
    const highest = [...countMilestones].reverse().find((m) => sorted.length >= m);
    if (highest) {
      items.push({
        date: sorted[highest - 1].created_at,
        icon: Star,
        label: t('milestones.pauseCount', '{{count}} pauses', { count: highest }),
        detail: format(new Date(sorted[highest - 1].created_at), 'MMM d'),
      });
    }

    // 5. Longest streak
    const allDays = new Set<string>();
    for (const r of sorted) {
      if (r.outcome) allDays.add(new Date(r.created_at).toISOString().slice(0, 10));
    }
    for (const p of practiceEntries) {
      allDays.add(new Date(p.created_at).toISOString().slice(0, 10));
    }
    const daysSorted = Array.from(allDays).sort();
    let longestStreak = 0;
    let longestEnd = '';
    let current = 1;
    for (let i = 1; i < daysSorted.length; i++) {
      const diff = differenceInCalendarDays(new Date(daysSorted[i]), new Date(daysSorted[i - 1]));
      if (diff === 1) {
        current++;
        if (current > longestStreak) {
          longestStreak = current;
          longestEnd = daysSorted[i];
        }
      } else {
        current = 1;
      }
    }
    if (longestStreak >= 3) {
      items.push({
        date: longestEnd,
        icon: Flame,
        label: t('milestones.longestStreak', '{{days}}-day streak', { days: longestStreak }),
        detail: format(new Date(longestEnd), 'MMM d'),
      });
    }

    // 6. First practice
    if (practiceEntries.length > 0) {
      const firstPractice = [...practiceEntries].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      items.push({
        date: firstPractice.created_at,
        icon: Zap,
        label: t('milestones.firstPractice', 'First practice'),
        detail: format(new Date(firstPractice.created_at), 'MMM d'),
      });
    }

    // 7. First letter written
    if (letters.length > 0) {
      const firstLetter = [...letters].sort((a, b) => a.written_at.localeCompare(b.written_at))[0];
      items.push({
        date: firstLetter.written_at,
        icon: Scroll,
        label: t('milestones.firstLetter', 'First letter written'),
        detail: format(new Date(firstLetter.written_at), 'MMM d'),
      });
    }

    // 8. First letter delivered
    const delivered = letters.filter((l) => l.delivered && l.delivered_at);
    if (delivered.length > 0) {
      const firstDelivered = [...delivered].sort((a, b) => a.delivered_at!.localeCompare(b.delivered_at!))[0];
      items.push({
        date: firstDelivered.delivered_at!,
        icon: Mail,
        label: t('milestones.firstDelivery', 'First letter delivered'),
        detail: format(new Date(firstDelivered.delivered_at!), 'MMM d'),
      });
    }

    // Sort by date descending (most recent first)
    items.sort((a, b) => b.date.localeCompare(a.date));

    return items;
  }, [reflections, practiceEntries, t]);

  if (milestones.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Flag className="h-5 w-5 mx-auto text-muted-foreground/30" />
        <p className="text-xs font-mono text-muted-foreground/50">
          {t('milestones.empty', 'Your milestones will appear here as you build your practice.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {milestones.map((milestone, i) => {
        const Icon = milestone.icon;
        const isFirst = i === 0;
        const isLast = i === milestones.length - 1;

        return (
          <div key={`${milestone.label}-${milestone.date}`} className="flex items-stretch gap-3">
            {/* Timeline line + dot */}
            <div className="relative flex flex-col items-center w-6 shrink-0">
              {!isFirst && <div className="absolute top-0 bottom-1/2 w-px bg-border/40" />}
              {!isLast && <div className="absolute top-1/2 bottom-0 w-px bg-border/40" />}
              <div className="my-auto rounded-full p-1.5 bg-muted border border-border/60 z-10">
                <Icon className="h-3 w-3 text-primary/70" />
              </div>
            </div>

            {/* Content */}
            <div className="py-2.5 min-w-0">
              <p className="text-foreground/80 leading-tight font-sans font-medium text-base">{milestone.label}</p>
              <p className="mt-0.5 text-sm font-sans text-muted-foreground">{milestone.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
