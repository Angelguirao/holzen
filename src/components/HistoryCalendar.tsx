import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles, Scroll, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOOD_COLORS: Record<string, string> = {
  fomo: 'bg-amber-400',
  excited: 'bg-yellow-400',
  greedy: 'bg-orange-400',
  anxious: 'bg-red-400',
  calm: 'bg-emerald-400',
  detached: 'bg-slate-400',
  uncertain: 'bg-purple-400',
  fearful: 'bg-rose-400',
};

// Day-level tint: maps dominant mood to a subtle background
const DAY_TINT: Record<string, string> = {
  calm: 'bg-emerald-500/8',
  detached: 'bg-slate-500/8',
  excited: 'bg-yellow-500/8',
  fomo: 'bg-amber-500/10',
  greedy: 'bg-orange-500/10',
  anxious: 'bg-red-500/10',
  fearful: 'bg-rose-500/10',
  uncertain: 'bg-purple-500/8',
};

export type ActivityType = 'reflection' | 'ritual' | 'letter' | 'badge';

export interface CalendarActivity {
  date: string;
  type: ActivityType;
  mood?: string | null;
  id: string;
  label?: string;
}

interface Props {
  activities: CalendarActivity[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDominantMood(activities: CalendarActivity[]): string | null {
  const moods = activities.filter((a) => a.type === 'reflection' && a.mood).map((a) => a.mood!);
  if (moods.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const m of moods) counts[m] = (counts[m] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function HistoryCalendar({ activities, selectedDate, onSelectDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      {/* Month navigation */}
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

      {/* Grid */}
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

              {/* Intensity indicator: small bar */}
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

      {/* Selected day detail */}
      {selectedDate && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
          {(activityMap.get(format(selectedDate, 'yyyy-MM-dd')) || []).length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic">No activity.</p>
          ) : (
            <div className="space-y-1">
              {(activityMap.get(format(selectedDate, 'yyyy-MM-dd')) || []).map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  {a.type === 'reflection' && (
                    <>
                      <span className={cn('h-2 w-2 rounded-full', MOOD_COLORS[a.mood || ''] || 'bg-foreground/30')} />
                      <span className="text-muted-foreground capitalize">{a.mood || 'reflection'}</span>
                    </>
                  )}
                  {a.type === 'ritual' && (
                    <>
                      <Sparkles className="h-2.5 w-2.5 text-primary/60" />
                      <span className="text-muted-foreground">{a.label || 'Ritual'}</span>
                    </>
                  )}
                  {a.type === 'letter' && (
                    <>
                      <Scroll className="h-2.5 w-2.5 text-amber-500/60" />
                      <span className="text-muted-foreground">{a.label || 'Letter'}</span>
                    </>
                  )}
                  {a.type === 'badge' && (
                    <>
                      <Award className="h-2.5 w-2.5 text-yellow-500/60" />
                      <span className="text-muted-foreground capitalize">{a.label?.replace(/-/g, ' ') || 'Badge'}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
