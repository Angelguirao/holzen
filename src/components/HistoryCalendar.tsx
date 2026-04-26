import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles, Scroll, Award, Heart, PenLine, Scan, RotateCcw, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const MOOD_COLORS: Record<string, string> = {
  fomo: 'bg-primary/70',
  excited: 'bg-primary',
  greedy: 'bg-secondary-foreground/80',
  anxious: 'bg-destructive/80',
  calm: 'bg-accent-foreground/70',
  detached: 'bg-muted-foreground/70',
  uncertain: 'bg-secondary-foreground/60',
  fearful: 'bg-destructive',
};

const DAY_TINT: Record<string, string> = {
  calm: 'bg-accent/40',
  detached: 'bg-muted/60',
  excited: 'bg-primary/10',
  fomo: 'bg-primary/15',
  greedy: 'bg-secondary/70',
  anxious: 'bg-destructive/10',
  fearful: 'bg-destructive/15',
  uncertain: 'bg-secondary/40',
};

export type ActivityType = 'pause' | 'letter' | 'badge' | 'practice' | 'library';

export interface CalendarActivity {
  date: string;
  type: ActivityType;
  mood?: string | null;
  id: string;
  label?: string;
  practiceType?: string;
}

interface Props {
  activities: CalendarActivity[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

function getDominantMood(activities: CalendarActivity[]): string | null {
  const moods = activities.filter((a) => a.type === 'pause' && a.mood).map((a) => a.mood!);
  if (moods.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const m of moods) counts[m] = (counts[m] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function HistoryCalendar({ activities, selectedDate, onSelectDate }: Props) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const WEEKDAYS = [
    t('calendar.su'), t('calendar.mo'), t('calendar.tu'),
    t('calendar.we'), t('calendar.th'), t('calendar.fr'), t('calendar.sa'),
  ];

  const activityMap = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    for (const a of activities) {
      const key = format(new Date(a.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [activities]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const goToPrev = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const goToNext = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    onSelectDate(null);
  }, [onSelectDate]);

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

        {days.map((day) => {
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

      {selectedDate && (() => {
        const dayItems = activityMap.get(format(selectedDate, 'yyyy-MM-dd')) || [];
        if (dayItems.length === 0) {
          return (
            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground/40 italic mt-1">{t('calendar.noActivity')}</p>
            </div>
          );
        }

        const pauseDayMarkers = dayItems.filter((a) => a.type === 'pause');
        const lettersList = dayItems.filter((a) => a.type === 'letter');
        const badgesList = dayItems.filter((a) => a.type === 'badge');
        const practiceList = dayItems.filter((a) => a.type === 'practice');
        const libraryList = dayItems.filter((a) => a.type === 'library');

        const moodCounts: Record<string, number> = {};
        pauseDayMarkers.forEach((r) => {
          const m = r.mood || 'neutral';
          moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
        const totalMoods = pauseDayMarkers.length;
        const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

        return (
          <div className="space-y-3 pt-3 border-t border-border/30">
            <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>

            <div className="flex items-center gap-3">
              {pauseDayMarkers.length > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {t('calendar.pauseCount', { count: pauseDayMarkers.length })}
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
              {libraryList.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                  <BookOpen className="h-2.5 w-2.5 text-primary/70" />
                  {t('calendar.libraryCount', { count: libraryList.length, defaultValue: '{{count}} library item(s)' })}
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

            {(badgesList.length > 0 || practiceList.length > 0 || libraryList.length > 0) && (
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
                {libraryList.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-2.5 w-2.5 text-primary/70 shrink-0" />
                    <span>{l.label || t('calendar.libraryItem', { defaultValue: 'Saved to library' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
