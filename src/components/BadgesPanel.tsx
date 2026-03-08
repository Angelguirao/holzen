import { useMemo } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Flame, MessageSquare, Shield, Zap, Eye, Heart, Award, Target, Wind, BookOpen, Feather, Radio, Telescope, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { BadgeCelebration } from './BadgeCelebration';
import { useBadgeSync } from '@/hooks/use-badge-sync';

interface Reflection {
  id: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  is_favorite: boolean;
  note: string | null;
  breathing_completed?: boolean;
  haiku_read?: boolean;
  learning_read?: boolean;
  signal_source?: string | null;
  zoom_out_read?: boolean;
  history_read?: boolean;
}

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: typeof Flame;
  category: 'streak' | 'volume' | 'composure' | 'engagement' | 'companions';
  color: string;
  earned: boolean;
  progress: number;
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
  companions: 'Companion Engagement',
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

    // Companion engagement counts
    const breathingCount = reflections.filter((r) => r.breathing_completed).length;
    const haikuCount = reflections.filter((r) => r.haiku_read).length;
    const groundCount = reflections.filter((r) => r.learning_read).length;
    const signalCount = reflections.filter((r) => !!r.signal_source).length;
    const zoomOutCount = reflections.filter((r) => r.zoom_out_read).length;
    const historyCount = reflections.filter((r) => r.history_read).length;
    const allSixCount = reflections.filter(
      (r) => r.breathing_completed && r.haiku_read && r.learning_read && !!r.signal_source && r.zoom_out_read && r.history_read
    ).length;

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
      id, label, description, icon, category, color,
      earned: current >= requirement,
      progress: Math.min(current / requirement, 1),
      requirement, current, unit,
    });

    return [
      // Streak badges (expanded milestones)
      makeBadge('streak-3', 'Getting Started', '3-day reflection streak', Flame, 'streak', 'hsl(35, 65%, 60%)', longestStreak, 3, 'days'),
      makeBadge('streak-7', 'Week Watcher', '7-day reflection streak', Flame, 'streak', 'hsl(25, 70%, 55%)', longestStreak, 7, 'days'),
      makeBadge('streak-14', 'Fortnight Focus', '14-day reflection streak', Flame, 'streak', 'hsl(20, 72%, 52%)', longestStreak, 14, 'days'),
      makeBadge('streak-30', 'Month Mind', '30-day reflection streak', Flame, 'streak', 'hsl(15, 75%, 50%)', longestStreak, 30, 'days'),
      makeBadge('streak-60', 'Steady Hand', '60-day reflection streak', Flame, 'streak', 'hsl(10, 78%, 47%)', longestStreak, 60, 'days'),
      makeBadge('streak-100', 'Century Stoic', '100-day reflection streak', Flame, 'streak', 'hsl(5, 80%, 45%)', longestStreak, 100, 'days'),
      makeBadge('streak-365', 'Year of Composure', '365-day reflection streak', Flame, 'streak', 'hsl(0, 85%, 42%)', longestStreak, 365, 'days'),

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

      // Companion engagement badges
      makeBadge('breathe-5', 'First Breaths', 'Completed breathing 5 times', Wind, 'companions', 'hsl(190, 50%, 50%)', breathingCount, 5, 'sessions'),
      makeBadge('breathe-25', 'Breath Master', 'Completed breathing 25 times', Wind, 'companions', 'hsl(195, 55%, 45%)', breathingCount, 25, 'sessions'),
      makeBadge('breathe-100', 'Zen Lungs', 'Completed breathing 100 times', Wind, 'companions', 'hsl(200, 60%, 40%)', breathingCount, 100, 'sessions'),
      makeBadge('haiku-10', 'Poetry Reader', 'Read 10 haiku', Feather, 'companions', 'hsl(280, 40%, 50%)', haikuCount, 10, 'haiku'),
      makeBadge('haiku-50', 'Verse Devotee', 'Read 50 haiku', Feather, 'companions', 'hsl(285, 45%, 45%)', haikuCount, 50, 'haiku'),
      makeBadge('learn-10', 'Grounded Mind', 'Used Ground Yourself 10 times', BookOpen, 'companions', 'hsl(45, 50%, 48%)', groundCount, 10, 'sessions'),
      makeBadge('learn-50', 'Scholar of Calm', 'Used Ground Yourself 50 times', BookOpen, 'companions', 'hsl(50, 55%, 43%)', groundCount, 50, 'sessions'),
      makeBadge('signal-10', 'Signal Reader', 'Read 10 signals', Radio, 'companions', 'hsl(30, 50%, 48%)', signalCount, 10, 'signals'),
      makeBadge('signal-50', 'Deep Listener', 'Read 50 signals', Radio, 'companions', 'hsl(35, 55%, 43%)', signalCount, 50, 'signals'),
      makeBadge('zoom-5', 'Long View', 'Used Zoom Out 5 times', Telescope, 'companions', 'hsl(240, 45%, 50%)', zoomOutCount, 5, 'sessions'),
      makeBadge('zoom-25', 'Macro Thinker', 'Used Zoom Out 25 times', Telescope, 'companions', 'hsl(245, 50%, 45%)', zoomOutCount, 25, 'sessions'),
      makeBadge('history-5', 'History Student', 'Read 5 historical insights', Landmark, 'companions', 'hsl(60, 40%, 48%)', historyCount, 5, 'insights'),
      makeBadge('history-25', 'Cycle Sage', 'Read 25 historical insights', Landmark, 'companions', 'hsl(65, 45%, 43%)', historyCount, 25, 'insights'),
      makeBadge('all-6-5', 'Full Practice', 'Used all 6 companions in 5 reflections', Award, 'companions', 'hsl(310, 45%, 48%)', allSixCount, 5, 'full sessions'),
      makeBadge('all-6-25', 'Complete Discipline', 'Used all 6 companions in 25 reflections', Award, 'companions', 'hsl(315, 50%, 43%)', allSixCount, 25, 'full sessions'),

      // Engagement badges
      makeBadge('fav-5', 'Curator', '5 favorited reflections', Heart, 'engagement', 'hsl(340, 50%, 50%)', favCount, 5, 'favorites'),
      makeBadge('fav-25', 'Archivist', '25 favorited reflections', Heart, 'engagement', 'hsl(345, 55%, 45%)', favCount, 25, 'favorites'),
      makeBadge('notes-10', 'Journaler', '10 personal notes', Eye, 'engagement', 'hsl(270, 40%, 50%)', noteCount, 10, 'notes'),
      makeBadge('notes-50', 'Deep Diarist', '50 personal notes', Eye, 'engagement', 'hsl(275, 45%, 45%)', noteCount, 50, 'notes'),
      makeBadge('active-streak', 'On Fire', 'Currently on a 7+ day streak', Zap, 'engagement', 'hsl(40, 70%, 50%)', currentStreak, 7, 'day streak'),
      makeBadge('active-streak-30', 'Unstoppable', 'Currently on a 30+ day streak', Zap, 'engagement', 'hsl(35, 75%, 45%)', currentStreak, 30, 'day streak'),
    ];
  }, [reflections]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const categories = ['streak', 'volume', 'composure', 'companions', 'engagement'] as const;

  // Next badge to earn
  const nextBadge = badges.find((b) => !b.earned && b.progress > 0);

  // Badge sync for celebration
  const earnedBadgeIds = useMemo(() => badges.filter((b) => b.earned).map((b) => b.id), [badges]);
  const badgeMeta = useMemo(() => {
    const meta: Record<string, { label: string; description: string; color: string }> = {};
    for (const b of badges) {
      if (b.earned) meta[b.id] = { label: b.label, description: b.description, color: b.color };
    }
    return meta;
  }, [badges]);

  const { newBadges, dismissCelebration } = useBadgeSync(earnedBadgeIds, badgeMeta);

  return (
    <>
      {newBadges.length > 0 && (
        <BadgeCelebration badges={newBadges} onDismiss={dismissCelebration} />
      )}
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <p className="text-xs font-mono text-muted-foreground">
              <span className="text-foreground font-medium">{earnedCount}</span> / {badges.length} earned
            </p>
          </div>
          <div className="h-1.5 flex-1 max-w-[120px] ml-4 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / badges.length) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
        {nextBadge && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
            <nextBadge.icon className="h-3 w-3" style={{ color: nextBadge.color }} />
            <span>
              Next: <span className="text-foreground/70">{nextBadge.label}</span> — {nextBadge.current}/{nextBadge.requirement} {nextBadge.unit}
            </span>
          </div>
        )}
      </div>

      {/* Badge grid by category */}
      {categories.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat);
        const catEarned = catBadges.filter((b) => b.earned).length;
        return (
          <div key={cat} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">
                {CATEGORY_LABELS[cat]}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/40">
                {catEarned}/{catBadges.length}
              </p>
            </div>
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

                  {badge.earned && (
                    <p className="text-[9px] font-mono text-primary/70">Earned ✓</p>
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
