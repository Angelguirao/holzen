import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, subDays, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, Scroll, Award, Heart, PenLine, Scan, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { filterCompleted, pauseTimestamp } from '@/lib/engaged-pause';

// ─── Types ───
interface Reflection {
  created_at: string;
  engaged_at?: string | null;
  outcome: string | null;
  mood?: string | null;
}

interface PracticeEntry {
  created_at: string;
  type: string;
}

interface Props {
  reflections: Reflection[];
  practiceEntries?: PracticeEntry[];
  streakFreezeDates?: string[];
  memberSince?: string | null;
}

// ─── Streak computation (from StreakTimeline) ───
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

const MOOD_COLORS: Record<string, string> = {
  fomo: 'bg-primary/70', excited: 'bg-primary', greedy: 'bg-secondary-foreground/80',
  anxious: 'bg-destructive/80', calm: 'bg-accent-foreground/70', detached: 'bg-muted-foreground/70',
  uncertain: 'bg-secondary-foreground/60', fearful: 'bg-destructive',
};

const DAY_TINT: Record<string, string> = {
  calm: 'bg-accent/40', detached: 'bg-muted/60', excited: 'bg-primary/10',
  fomo: 'bg-primary/15', greedy: 'bg-secondary/70', anxious: 'bg-destructive/10',
  fearful: 'bg-destructive/15', uncertain: 'bg-secondary/40',
};

type ActivityType = 'reflection' | 'letter' | 'badge' | 'practice';

interface CalendarActivity {
  date: string;
  type: ActivityType;
  mood?: string | null;
  id: string;
  label?: string;
  practiceType?: string;
}

type ReflectionActivityRow = { id: string; created_at: string; engaged_at: string | null; outcome: string | null; mood: string | null };
type LetterActivityRow = { id: string; written_at: string; deliver_during: string | null };
type BadgeActivityRow = { id: string; earned_at: string; badge_id: string | null };
type PracticeActivityRow = { id: string; created_at: string; type: string; mood: string | null };

export function JourneyWidget({ reflections, practiceEntries = [], streakFreezeDates = [], memberSince }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  // ─── Streak heatmap data ───
  const { days, currentStreak, longestStreak, nextMilestone } = useMemo(() => {
    const today = new Date();
    const dayCount = 28;
    const memberStart = memberSince ? new Date(memberSince).toISOString().slice(0, 10) : null;
    const dayMap = new Map<string, 'outcome' | 'practice' | 'freeze' | 'empty' | 'pre'>();

    for (let i = 0; i < dayCount; i++) {
      const d = subDays(today, i).toISOString().slice(0, 10);
      if (memberStart && d < memberStart) {
        dayMap.set(d, 'pre');
      } else {
        dayMap.set(d, streakFreezeDates.includes(d) ? 'freeze' : 'empty');
      }
    }

    for (const p of practiceEntries) {
      const d = new Date(p.created_at).toISOString().slice(0, 10);
      if (dayMap.has(d) && dayMap.get(d) === 'empty') dayMap.set(d, 'practice');
    }

    // Only count reflections the user actually completed. Ignored notifications
    // (rows that were generated but never engaged with) used to light up the
    // grid as a gray "Paused (no outcome)" cell, which misrepresented activity.
    // Also key by engaged_at (via pauseTimestamp) so a cron row the user
    // acted on the next day lands in the correct day bucket.
    const completedReflections = filterCompleted(reflections);
    for (const r of completedReflections) {
      const d = pauseTimestamp(r).toISOString().slice(0, 10);
      if (dayMap.has(d)) {
        const current = dayMap.get(d);
        if (current === 'empty' || current === 'practice') {
          dayMap.set(d, 'outcome');
        }
      }
    }

    const allDays = new Set<string>();
    for (const r of completedReflections) {
      allDays.add(pauseTimestamp(r).toISOString().slice(0, 10));
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

    const daysList = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, status]) => ({ date, status }));

    return { days: daysList, currentStreak: current, longestStreak: longest, nextMilestone };
  }, [reflections, practiceEntries, streakFreezeDates, memberSince]);

  // ─── Calendar data (loaded on expand) ───
  const [calendarActivities, setCalendarActivities] = useState<CalendarActivity[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!expanded || calendarLoaded || !user) return;
    setCalendarLoading(true);

    const load = async () => {
      const [{ data: refs }, { data: lets }, { data: bads }, { data: pracs }] = await Promise.all([
        supabase.from('reflections').select('id, created_at, engaged_at, outcome, mood').eq('user_id', user.id),
        supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', user.id),
        supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id),
        supabase.from('practice_entries').select('id, created_at, type, mood, prompt').eq('user_id', user.id),
      ]);

      const PRACTICE_LABELS: Record<string, string> = {
        checkin: 'Emotional check-in',
        journal: 'Guided journal',
        bodyscan: 'Body scan',
        replay: 'Reflection replay',
      };

      const items: CalendarActivity[] = [];
      // Calendar activity should only reflect pauses the user actually
      // completed. Ignored-notification rows still carry a pre-filled mood
      // from the cron worker (see src/lib/engaged-pause.ts docstring), so
      // without filterCompleted + pauseTimestamp the calendar would dot days
      // the user never engaged on AND poison the dominant-mood tint.
      filterCompleted((refs as unknown as ReflectionActivityRow[] | null) ?? []).forEach((r) =>
        items.push({
          date: pauseTimestamp(r).toISOString(),
          type: 'reflection',
          mood: r.mood,
          id: r.id,
        }),
      );
      (lets as LetterActivityRow[] | null ?? []).forEach((l) => items.push({ date: l.written_at, type: 'letter', id: l.id, label: `Letter → ${l.deliver_during}` }));
      (bads as BadgeActivityRow[] | null ?? []).forEach((b) => items.push({ date: b.earned_at, type: 'badge', id: b.id, label: b.badge_id ?? '' }));
      (pracs as PracticeActivityRow[] | null ?? []).forEach((p) => items.push({
        date: p.created_at,
        type: 'practice',
        id: p.id,
        label: PRACTICE_LABELS[p.type] ?? p.type,
        mood: p.mood,
        practiceType: p.type,
      }));
      setCalendarActivities(items);
      setCalendarLoaded(true);
      setCalendarLoading(false);
    };
    load();
  }, [expanded, calendarLoaded, user]);

  const activityMap = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    for (const a of calendarActivities) {
      const key = format(new Date(a.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [calendarActivities]);

  if (reflections.length === 0 && practiceEntries.length === 0) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3 mb-0">
      {/* Streak header */}
      <div className="flex items-center justify-between">
        <p className="tracking-widest uppercase text-sm font-sans mb-[8px] font-medium text-secondary-foreground">
          {t('streakTimeline.title')}
        </p>
        {nextMilestone && currentStreak > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground/60">
            {t('streakTimeline.daysToMilestone', { days: nextMilestone - currentStreak, milestone: nextMilestone })}
          </p>
        )}
      </div>

      {/* 28-day heatmap grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, status }) => {
          const isTodayDate = date === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={date}
              title={`${format(new Date(date), 'MMM d')} — ${status === 'pre' ? t('streakTimeline.beforeSignup') : t(`streakTimeline.status.${status}`)}`}
              className={`aspect-square rounded-sm transition-colors ${
                status === 'outcome' ? 'bg-primary'
                : status === 'practice' ? 'bg-accent-foreground/20'
                : status === 'freeze' ? 'bg-secondary/60'
                : status === 'pre' ? 'bg-transparent border border-border/20'
                : 'bg-muted/50'
              } ${isTodayDate ? 'ring-1 ring-foreground/20' : ''}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono" style={{ color: '#C1CBD7' }}>
        <span className="flex items-center gap-1 font-sans text-sm my-[16px] mb-[8px]">
          <span className="h-2 w-2 rounded-sm bg-primary" /> {t('streakTimeline.legend.outcomeLogged')}
        </span>
        <span className="flex items-center gap-1 text-sm font-sans mb-[16px]">
          <span className="h-2 w-2 rounded-sm bg-accent-foreground/20" /> {t('streakTimeline.legend.practiceOnly', 'Practice only')}
        </span>
        <span className="flex items-center gap-1 text-sm font-sans mb-[16px]">
          <span className="h-2 w-2 rounded-sm bg-secondary/60 border" style={{ borderColor: '#7B8A9E' }} /> {t('streakTimeline.legend.streakFreeze')}
        </span>
      </div>

      {/* Streak progress bar */}
      {currentStreak > 0 && nextMilestone && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>{t('streakTimeline.streakDays', { days: currentStreak })}</span>
            <span>{t('streakTimeline.milestoneDays', { days: nextMilestone })}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min((currentStreak / nextMilestone) * 100, 100)}%`, backgroundColor: '#C1CBD7' }}
            />
          </div>
        </div>
      )}

      {/* Expand to calendar */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-center gap-1.5 pt-1 transition-colors text-base font-sans font-medium"
        style={{ color: '#C1CBD7' }}
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3 w-3" />
        </motion.div>
        {expanded
          ? t('journey.hideCalendar', 'Hide calendar')
          : t('journey.showCalendar', 'Full calendar')}
      </button>

      {/* Expandable calendar */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-border/30 space-y-3">
              {calendarLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <CalendarView
                  activityMap={activityMap}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Calendar subcomponent ───
function CalendarView({
  activityMap,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  onSelectDate,
}: {
  activityMap: Map<string, CalendarActivity[]>;
  currentMonth: Date;
  setCurrentMonth: (fn: (d: Date) => Date) => void;
  selectedDate: Date | null;
  onSelectDate: (d: Date | null) => void;
}) {
  const { t } = useTranslation();

  const WEEKDAYS = [
    t('calendar.su'), t('calendar.mo'), t('calendar.tu'),
    t('calendar.we'), t('calendar.th'), t('calendar.fr'), t('calendar.sa'),
  ];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const goToPrev = useCallback(() => setCurrentMonth((m: Date) => subMonths(m, 1)), [setCurrentMonth]);
  const goToNext = useCallback(() => setCurrentMonth((m: Date) => addMonths(m, 1)), [setCurrentMonth]);
  const goToToday = useCallback(() => {
    setCurrentMonth(() => new Date());
    onSelectDate(null);
  }, [setCurrentMonth, onSelectDate]);

  function getDominantMood(activities: CalendarActivity[]): string | null {
    const moods = activities.filter((a) => a.type === 'reflection' && a.mood).map((a) => a.mood!);
    if (moods.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const m of moods) counts[m] = (counts[m] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={goToPrev} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={goToToday} className="text-xs font-mono tracking-wider text-foreground hover:text-primary transition-colors">
          {format(currentMonth, 'MMMM yyyy')}
        </button>
        <button onClick={goToNext} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono text-muted-foreground/40 uppercase py-1">
            {d}
          </div>
        ))}

        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {calDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayActivities = activityMap.get(key) || [];
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const hasActivities = dayActivities.length > 0;
          const dominantMood = getDominantMood(dayActivities);
          const tint = dominantMood ? DAY_TINT[dominantMood] : undefined;
          const count = dayActivities.length;

          return (
            <button
              key={key}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-md text-xs font-mono transition-all relative',
                isSelected
                  ? 'ring-1 ring-primary/50 bg-primary/10 text-foreground'
                  : hasActivities
                    ? cn('hover:bg-muted/40 text-foreground', tint)
                    : 'text-muted-foreground/25',
                isCurrentDay && !isSelected && 'ring-1 ring-border/60',
              )}
            >
              <span className={cn('text-[11px]', isCurrentDay && 'font-semibold')}>
                {format(day, 'd')}
              </span>

              {hasActivities && (
                <div className="absolute bottom-[3px] flex items-center gap-[1px]">
                  {count <= 3 ? (
                    Array.from({ length: count }).map((_, i) => (
                      <span key={i} className={cn('h-[3px] w-[3px] rounded-full', dominantMood ? (MOOD_COLORS[dominantMood] || 'bg-foreground/30') : 'bg-foreground/20')} />
                    ))
                  ) : (
                    <span className={cn('h-[3px] rounded-full', dominantMood ? (MOOD_COLORS[dominantMood] || 'bg-foreground/30') : 'bg-foreground/20')}
                      style={{ width: `${Math.min(count * 2, 16)}px` }}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {selectedDate && <DayDetail date={selectedDate} activities={activityMap.get(format(selectedDate, 'yyyy-MM-dd')) || []} />}
    </div>
  );
}

function DayDetail({ date, activities }: { date: Date; activities: CalendarActivity[] }) {
  const { t } = useTranslation();

  if (activities.length === 0) {
    return (
      <div className="pt-2 border-t border-border/30">
        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </p>
        <p className="text-xs text-muted-foreground/40 italic mt-1">{t('calendar.noActivity')}</p>
      </div>
    );
  }

  const reflections = activities.filter((a) => a.type === 'reflection');
  const lettersList = activities.filter((a) => a.type === 'letter');
  const badgesList = activities.filter((a) => a.type === 'badge');
  const practiceList = activities.filter((a) => a.type === 'practice');

  const moodCounts: Record<string, number> = {};
  reflections.forEach((r) => {
    const m = r.mood || 'neutral';
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });
  const totalMoods = reflections.length;
  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3 pt-3 border-t border-border/30">
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        {format(date, 'EEEE, MMMM d, yyyy')}
      </p>

      <div className="flex items-center gap-3">
        {reflections.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {t('calendar.reflectionCount', { count: reflections.length })}
          </span>
        )}
        {lettersList.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Scroll className="h-2.5 w-2.5 text-primary/70" />
            {t('calendar.letterCount', { count: lettersList.length })}
          </span>
        )}
        {badgesList.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Award className="h-2.5 w-2.5 text-secondary-foreground/70" />
            {t('calendar.badgeCount', { count: badgesList.length })}
          </span>
        )}
        {practiceList.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Heart className="h-2.5 w-2.5 text-accent-foreground/70" />
            {t('calendar.practiceCount', { count: practiceList.length })}
          </span>
        )}
      </div>

      {totalMoods > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-2 rounded-full overflow-hidden">
            {sortedMoods.map(([mood, count]) => (
              <div
                key={mood}
                className={cn('h-full', MOOD_COLORS[mood] || 'bg-foreground/20')}
                style={{ width: `${(count / totalMoods) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {sortedMoods.map(([mood, count]) => (
              <span key={mood} className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/60">
                <span className={cn('h-[5px] w-[5px] rounded-full', MOOD_COLORS[mood] || 'bg-foreground/20')} />
                {t(`moodCheck.moods.${mood}`, mood)} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {(badgesList.length > 0 || practiceList.length > 0) && (
        <div className="space-y-1">
          {badgesList.map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-2.5 w-2.5 text-secondary-foreground/70 shrink-0" />
              <span className="capitalize">{b.label?.replace(/-/g, ' ') || t('calendar.badge')}</span>
            </div>
          ))}
          {practiceList.map((p) => {
            const PIcon = p.practiceType === 'journal' ? PenLine : p.practiceType === 'bodyscan' ? Scan : p.practiceType === 'replay' ? RotateCcw : Heart;
            return (
              <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <PIcon className="h-2.5 w-2.5 text-accent-foreground/70 shrink-0" />
                <span>{p.label || t('calendar.practice')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
