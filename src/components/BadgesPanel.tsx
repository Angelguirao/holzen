import { useMemo } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Flame, MessageSquare, Shield, Zap, Eye, Heart, Award, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface Reflection {
  id: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  is_favorite: boolean;
  note: string | null;
}

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: typeof Flame;
  category: 'streak' | 'volume' | 'composure' | 'engagement';
  color: string;
  earned: boolean;
  progress: number; // 0-1
  requirement: number;
  current: number;
  unit: string;
}

function computeLongestStreak(reflections: Reflection[]): number {
  if (reflections.length === 0) return 0;
  const days = new Set<string>();
  for (const r of reflections) {
    days.add(parseISO(r.created_at).toISOString().slice(0, 10));
  }
  const sorted = Array.from(days).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(new Date(sorted[i]), new Date(sorted[i - 1]));
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function computeCurrentStreak(reflections: Reflection[]): number {
  if (reflections.length === 0) return 0;
  const days = new Set<string>();
  for (const r of reflections) {
    days.add(parseISO(r.created_at).toISOString().slice(0, 10));
  }
  const sorted = Array.from(days).sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const daysSinceLast = differenceInCalendarDays(new Date(today), new Date(sorted[0]));
  if (daysSinceLast > 1) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

const CATEGORY_LABELS: Record<string, string> = {
  streak: 'Consistency',
  volume: 'Reflection Count',
  composure: 'Composure',
  engagement: 'Engagement',
};

interface BadgesPanelProps {
  reflections: Reflection[];
}

export function BadgesPanel({ reflections }: BadgesPanelProps) {
  const badges = useMemo(() => {
    const total = reflections.length;
    const longestStreak = computeLongestStreak(reflections);
    const currentStreak = computeCurrentStreak(reflections);
    const calmCount = reflections.filter((r) => r.mood === 'calm').length;
    const heldCount = reflections.filter((r) => r.outcome === 'held' || r.outcome === 'nothing').length;
    const favCount = reflections.filter((r) => r.is_favorite).length;
    const noteCount = reflections.filter((r) => r.note).length;

    const makeBadge = (
      id: string,
      label: string,
      description: string,
      icon: typeof Flame,
      category: Badge['category'],
      color: string,
      current: number,
      requirement: number,
      unit: string
    ): Badge => ({
      id,
      label,
      description,
      icon,
      category,
      color,
      earned: current >= requirement,
      progress: Math.min(current / requirement, 1),
      requirement,
      current,
      unit,
    });

    return [
      // Streak badges
      makeBadge('streak-7', 'Week Watcher', '7-day reflection streak', Flame, 'streak', 'hsl(25, 70%, 55%)', longestStreak, 7, 'days'),
      makeBadge('streak-30', 'Month Mind', '30-day reflection streak', Flame, 'streak', 'hsl(15, 75%, 50%)', longestStreak, 30, 'days'),
      makeBadge('streak-100', 'Century Stoic', '100-day reflection streak', Flame, 'streak', 'hsl(5, 80%, 45%)', longestStreak, 100, 'days'),

      // Volume badges
      makeBadge('reflect-10', 'First Steps', '10 reflections logged', MessageSquare, 'volume', 'hsl(200, 50%, 50%)', total, 10, 'reflections'),
      makeBadge('reflect-50', 'Devoted Observer', '50 reflections logged', MessageSquare, 'volume', 'hsl(210, 55%, 45%)', total, 50, 'reflections'),
      makeBadge('reflect-100', 'Deep Practice', '100 reflections logged', MessageSquare, 'volume', 'hsl(220, 60%, 40%)', total, 100, 'reflections'),
      makeBadge('reflect-500', 'Masterful Patience', '500 reflections logged', MessageSquare, 'volume', 'hsl(230, 65%, 35%)', total, 500, 'reflections'),

      // Composure badges
      makeBadge('calm-10', 'Still Waters', '10 calm mood checks', Shield, 'composure', 'hsl(150, 40%, 45%)', calmCount, 10, 'calm moods'),
      makeBadge('calm-50', 'Unshakeable', '50 calm mood checks', Shield, 'composure', 'hsl(160, 45%, 40%)', calmCount, 50, 'calm moods'),
      makeBadge('held-10', 'Diamond Hands', 'Held steady 10 times', Target, 'composure', 'hsl(170, 40%, 42%)', heldCount, 10, 'holds'),
      makeBadge('held-50', 'Iron Will', 'Held steady 50 times', Target, 'composure', 'hsl(180, 45%, 38%)', heldCount, 50, 'holds'),

      // Engagement badges
      makeBadge('fav-5', 'Curator', '5 favorited reflections', Heart, 'engagement', 'hsl(340, 50%, 50%)', favCount, 5, 'favorites'),
      makeBadge('notes-10', 'Journaler', '10 personal notes', Eye, 'engagement', 'hsl(270, 40%, 50%)', noteCount, 10, 'notes'),
      makeBadge('active-streak', 'On Fire', 'Currently on a 7+ day streak', Zap, 'engagement', 'hsl(40, 70%, 50%)', currentStreak, 7, 'day streak'),
    ];
  }, [reflections]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const categories = ['streak', 'volume', 'composure', 'engagement'] as const;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <Award className="h-4 w-4 text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          <span className="text-foreground font-medium">{earnedCount}</span> / {badges.length} earned
        </p>
      </div>

      {/* Badge grid by category */}
      {categories.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat);
        return (
          <div key={cat} className="space-y-2.5">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {catBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`relative rounded-lg border px-3 py-3 space-y-2 transition-all ${
                    badge.earned
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/40 bg-muted/20 opacity-50'
                  }`}
                >
                  {/* Icon + label */}
                  <div className="flex items-center gap-2">
                    <badge.icon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: badge.earned ? badge.color : undefined }}
                    />
                    <p className={`text-xs font-mono leading-tight ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {badge.label}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    {badge.description}
                  </p>

                  {/* Progress bar */}
                  {!badge.earned && (
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: badge.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${badge.progress * 100}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        />
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground/50">
                        {badge.current} / {badge.requirement} {badge.unit}
                      </p>
                    </div>
                  )}

                  {/* Earned indicator */}
                  {badge.earned && (
                    <p className="text-[9px] font-mono text-primary/70">Earned</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
