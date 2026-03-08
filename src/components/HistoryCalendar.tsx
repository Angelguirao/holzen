import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, isToday, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Circle, Sparkles, Scroll, Award, BookOpen } from 'lucide-react';
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

export type ActivityType = 'reflection' | 'ritual' | 'letter' | 'badge';

export interface CalendarActivity {
  date: string; // ISO date
  type: ActivityType;
  mood?: string | null;
  id: string;
  label?: string;
}

interface Props {
  activities: CalendarActivity[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  activeFilters: Set<ActivityType>;
  onToggleFilter: (type: ActivityType) => void;
}

const ACTIVITY_TYPES: { type: ActivityType; icon: React.ReactNode; label: string }[] = [
  { type: 'reflection', icon: <Circle className="h-2.5 w-2.5" />, label: 'Reflections' },
  { type: 'ritual', icon: <Sparkles className="h-2.5 w-2.5" />, label: 'Rituals' },
  { type: 'letter', icon: <Scroll className="h-2.5 w-2.5" />, label: 'Letters' },
  { type: 'badge', icon: <Award className="h-2.5 w-2.5" />, label: 'Badges' },
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function HistoryCalendar({ activities, selectedDate, onSelectDate, activeFilters, onToggleFilter }: Props) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => activeFilters.has(a.type));
  }, [activities, activeFilters]);

  // Group activities by day key
  const activityMap = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    for (const a of filteredActivities) {
      const key = format(new Date(a.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [filteredActivities]);

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
    <div className="space-y-4">
      {/* Activity type filters */}
      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_TYPES.map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => onToggleFilter(type)}
            className={cn(
              'flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full border transition-colors',
              activeFilters.has(type)
                ? 'border-primary/40 bg-primary/5 text-foreground'
                : 'border-border/40 text-muted-foreground/50 hover:text-muted-foreground'
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

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

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono text-muted-foreground/40 uppercase py-1">
            {d}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayActivities = activityMap.get(key) || [];
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const hasActivities = dayActivities.length > 0;

          // Get unique moods for reflection dots
          const reflectionMoods = dayActivities
            .filter((a) => a.type === 'reflection' && a.mood)
            .map((a) => a.mood!);
          const hasRitual = dayActivities.some((a) => a.type === 'ritual');
          const hasLetter = dayActivities.some((a) => a.type === 'letter');
          const hasBadge = dayActivities.some((a) => a.type === 'badge');

          // Dominant mood for background tint
          const dominantMood = reflectionMoods[0];

          return (
            <button
              key={key}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center gap-0.5 rounded-md text-xs font-mono transition-all relative',
                isSelected
                  ? 'bg-primary/10 ring-1 ring-primary/40 text-foreground'
                  : hasActivities
                    ? 'hover:bg-muted/40 text-foreground'
                    : 'text-muted-foreground/30 hover:text-muted-foreground/50',
                isCurrentDay && !isSelected && 'ring-1 ring-border/60',
              )}
            >
              <span className={cn('text-[11px]', isCurrentDay && 'font-semibold')}>
                {format(day, 'd')}
              </span>

              {/* Activity dots */}
              {hasActivities && (
                <div className="flex items-center gap-[2px] absolute bottom-[3px]">
                  {reflectionMoods.slice(0, 3).map((mood, i) => (
                    <span
                      key={`m-${i}`}
                      className={cn('h-[4px] w-[4px] rounded-full', MOOD_COLORS[mood] || 'bg-foreground/30')}
                    />
                  ))}
                  {reflectionMoods.length === 0 && dayActivities.some((a) => a.type === 'reflection') && (
                    <span className="h-[4px] w-[4px] rounded-full bg-foreground/30" />
                  )}
                  {hasRitual && <span className="h-[4px] w-[4px] rounded-full bg-primary/60" />}
                  {hasLetter && <span className="h-[4px] w-[4px] rounded-full bg-amber-500/60" />}
                  {hasBadge && <span className="h-[4px] w-[4px] rounded-full bg-yellow-500/60" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        <div className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] rounded-full bg-emerald-400" />
          <span className="text-[8px] font-mono text-muted-foreground/40">calm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] rounded-full bg-red-400" />
          <span className="text-[8px] font-mono text-muted-foreground/40">anxious</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] rounded-full bg-amber-400" />
          <span className="text-[8px] font-mono text-muted-foreground/40">fomo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] rounded-full bg-primary/60" />
          <span className="text-[8px] font-mono text-muted-foreground/40">ritual</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] rounded-full bg-amber-500/60" />
          <span className="text-[8px] font-mono text-muted-foreground/40">letter</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-[5px] w-[5px] rounded-full bg-yellow-500/60" />
          <span className="text-[8px] font-mono text-muted-foreground/40">badge</span>
        </div>
      </div>

      {/* Selected day summary */}
      {selectedDate && (
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
          {(activityMap.get(format(selectedDate, 'yyyy-MM-dd')) || []).length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic">No activity on this day.</p>
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
                      <span className="text-muted-foreground">{a.label || 'Badge'}</span>
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
