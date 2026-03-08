import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  labelKey: string;
  descKey: string;
  icon: typeof Flame;
  category: 'streak' | 'volume' | 'composure' | 'engagement' | 'companions';
  color: string;
  earned: boolean;
  progress: number;
  requirement: number;
  current: number;
  unitKey: string;
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

interface BadgesPanelProps {
  reflections: Reflection[];
  notifyBadges?: boolean;
}

export function BadgesPanel({ reflections, notifyBadges = true }: BadgesPanelProps) {
  const { t } = useTranslation();

  const badges = useMemo(() => {
    const total = reflections.length;
    const longestStreak = computeLongestStreak(reflections);
    const currentStreak = computeCurrentStreak(reflections);
    const calmCount = reflections.filter((r) => r.mood === 'calm').length;
    const heldCount = reflections.filter((r) => r.outcome === 'held' || r.outcome === 'nothing').length;
    const favCount = reflections.filter((r) => r.is_favorite).length;
    const noteCount = reflections.filter((r) => r.note).length;
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
      labelKey: string,
      descKey: string,
      icon: typeof Flame,
      category: Badge['category'],
      color: string,
      current: number,
      requirement: number,
      unitKey: string
    ): Badge => ({
      id, labelKey, descKey, icon, category, color,
      earned: current >= requirement,
      progress: Math.min(current / requirement, 1),
      requirement, current, unitKey,
    });

    return [
      makeBadge('streak-3', 'badges.streak3', 'badges.streak3Desc', Flame, 'streak', 'hsl(35, 65%, 60%)', longestStreak, 3, 'badges.units.days'),
      makeBadge('streak-7', 'badges.streak7', 'badges.streak7Desc', Flame, 'streak', 'hsl(25, 70%, 55%)', longestStreak, 7, 'badges.units.days'),
      makeBadge('streak-14', 'badges.streak14', 'badges.streak14Desc', Flame, 'streak', 'hsl(20, 72%, 52%)', longestStreak, 14, 'badges.units.days'),
      makeBadge('streak-30', 'badges.streak30', 'badges.streak30Desc', Flame, 'streak', 'hsl(15, 75%, 50%)', longestStreak, 30, 'badges.units.days'),
      makeBadge('streak-60', 'badges.streak60', 'badges.streak60Desc', Flame, 'streak', 'hsl(10, 78%, 47%)', longestStreak, 60, 'badges.units.days'),
      makeBadge('streak-100', 'badges.streak100', 'badges.streak100Desc', Flame, 'streak', 'hsl(5, 80%, 45%)', longestStreak, 100, 'badges.units.days'),
      makeBadge('streak-365', 'badges.streak365', 'badges.streak365Desc', Flame, 'streak', 'hsl(0, 85%, 42%)', longestStreak, 365, 'badges.units.days'),
      makeBadge('reflect-10', 'badges.reflect10', 'badges.reflect10Desc', MessageSquare, 'volume', 'hsl(200, 50%, 50%)', total, 10, 'badges.units.reflections'),
      makeBadge('reflect-50', 'badges.reflect50', 'badges.reflect50Desc', MessageSquare, 'volume', 'hsl(210, 55%, 45%)', total, 50, 'badges.units.reflections'),
      makeBadge('reflect-100', 'badges.reflect100', 'badges.reflect100Desc', MessageSquare, 'volume', 'hsl(220, 60%, 40%)', total, 100, 'badges.units.reflections'),
      makeBadge('reflect-500', 'badges.reflect500', 'badges.reflect500Desc', MessageSquare, 'volume', 'hsl(230, 65%, 35%)', total, 500, 'badges.units.reflections'),
      makeBadge('calm-10', 'badges.calm10', 'badges.calm10Desc', Shield, 'composure', 'hsl(150, 40%, 45%)', calmCount, 10, 'badges.units.calmMoods'),
      makeBadge('calm-50', 'badges.calm50', 'badges.calm50Desc', Shield, 'composure', 'hsl(160, 45%, 40%)', calmCount, 50, 'badges.units.calmMoods'),
      makeBadge('held-10', 'badges.held10', 'badges.held10Desc', Target, 'composure', 'hsl(170, 40%, 42%)', heldCount, 10, 'badges.units.holds'),
      makeBadge('held-50', 'badges.held50', 'badges.held50Desc', Target, 'composure', 'hsl(180, 45%, 38%)', heldCount, 50, 'badges.units.holds'),
      makeBadge('breathe-5', 'badges.breathe5', 'badges.breathe5Desc', Wind, 'companions', 'hsl(190, 50%, 50%)', breathingCount, 5, 'badges.units.sessions'),
      makeBadge('breathe-25', 'badges.breathe25', 'badges.breathe25Desc', Wind, 'companions', 'hsl(195, 55%, 45%)', breathingCount, 25, 'badges.units.sessions'),
      makeBadge('breathe-100', 'badges.breathe100', 'badges.breathe100Desc', Wind, 'companions', 'hsl(200, 60%, 40%)', breathingCount, 100, 'badges.units.sessions'),
      makeBadge('haiku-10', 'badges.haiku10', 'badges.haiku10Desc', Feather, 'companions', 'hsl(280, 40%, 50%)', haikuCount, 10, 'badges.units.haiku'),
      makeBadge('haiku-50', 'badges.haiku50', 'badges.haiku50Desc', Feather, 'companions', 'hsl(285, 45%, 45%)', haikuCount, 50, 'badges.units.haiku'),
      makeBadge('learn-10', 'badges.learn10', 'badges.learn10Desc', BookOpen, 'companions', 'hsl(45, 50%, 48%)', groundCount, 10, 'badges.units.sessions'),
      makeBadge('learn-50', 'badges.learn50', 'badges.learn50Desc', BookOpen, 'companions', 'hsl(50, 55%, 43%)', groundCount, 50, 'badges.units.sessions'),
      makeBadge('signal-10', 'badges.signal10', 'badges.signal10Desc', Radio, 'companions', 'hsl(30, 50%, 48%)', signalCount, 10, 'badges.units.signals'),
      makeBadge('signal-50', 'badges.signal50', 'badges.signal50Desc', Radio, 'companions', 'hsl(35, 55%, 43%)', signalCount, 50, 'badges.units.signals'),
      makeBadge('zoom-5', 'badges.zoom5', 'badges.zoom5Desc', Telescope, 'companions', 'hsl(240, 45%, 50%)', zoomOutCount, 5, 'badges.units.sessions'),
      makeBadge('zoom-25', 'badges.zoom25', 'badges.zoom25Desc', Telescope, 'companions', 'hsl(245, 50%, 45%)', zoomOutCount, 25, 'badges.units.sessions'),
      makeBadge('history-5', 'badges.history5', 'badges.history5Desc', Landmark, 'companions', 'hsl(60, 40%, 48%)', historyCount, 5, 'badges.units.insights'),
      makeBadge('history-25', 'badges.history25', 'badges.history25Desc', Landmark, 'companions', 'hsl(65, 45%, 43%)', historyCount, 25, 'badges.units.insights'),
      makeBadge('all-6-5', 'badges.allSix5', 'badges.allSix5Desc', Award, 'companions', 'hsl(310, 45%, 48%)', allSixCount, 5, 'badges.units.fullSessions'),
      makeBadge('all-6-25', 'badges.allSix25', 'badges.allSix25Desc', Award, 'companions', 'hsl(315, 50%, 43%)', allSixCount, 25, 'badges.units.fullSessions'),
      makeBadge('fav-5', 'badges.fav5', 'badges.fav5Desc', Heart, 'engagement', 'hsl(340, 50%, 50%)', favCount, 5, 'badges.units.favorites'),
      makeBadge('fav-25', 'badges.fav25', 'badges.fav25Desc', Heart, 'engagement', 'hsl(345, 55%, 45%)', favCount, 25, 'badges.units.favorites'),
      makeBadge('notes-10', 'badges.notes10', 'badges.notes10Desc', Eye, 'engagement', 'hsl(270, 40%, 50%)', noteCount, 10, 'badges.units.notes'),
      makeBadge('notes-50', 'badges.notes50', 'badges.notes50Desc', Eye, 'engagement', 'hsl(275, 45%, 45%)', noteCount, 50, 'badges.units.notes'),
      makeBadge('active-streak', 'badges.activeStreak7', 'badges.activeStreak7Desc', Zap, 'engagement', 'hsl(40, 70%, 50%)', currentStreak, 7, 'badges.units.dayStreak'),
      makeBadge('active-streak-30', 'badges.activeStreak30', 'badges.activeStreak30Desc', Zap, 'engagement', 'hsl(35, 75%, 45%)', currentStreak, 30, 'badges.units.dayStreak'),
    ];
  }, [reflections]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const categories = ['streak', 'volume', 'composure', 'companions', 'engagement'] as const;

  const nextBadge = badges.find((b) => !b.earned && b.progress > 0);

  // Badge sync for celebration
  const earnedBadgeIds = useMemo(() => badges.filter((b) => b.earned).map((b) => b.id), [badges]);
  const badgeMeta = useMemo(() => {
    const meta: Record<string, { label: string; description: string; color: string }> = {};
    for (const b of badges) {
      if (b.earned) meta[b.id] = { label: t(b.labelKey), description: t(b.descKey), color: b.color };
    }
    return meta;
  }, [badges, t]);

  const { newBadges, dismissCelebration } = useBadgeSync(earnedBadgeIds, badgeMeta, notifyBadges);

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
              <span className="text-foreground font-medium">{earnedCount}</span> / {badges.length} {t('badges.earned')}
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
              {t('badges.next')}: <span className="text-foreground/70">{t(nextBadge.labelKey)}</span> — {nextBadge.current}/{nextBadge.requirement} {t(nextBadge.unitKey)}
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
                {t(`badges.categories.${cat}`)}
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
                      {t(badge.labelKey)}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    {t(badge.descKey)}
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
                        {badge.current} / {badge.requirement} {t(badge.unitKey)}
                      </p>
                    </div>
                  )}

                  {badge.earned && (
                    <p className="text-[9px] font-mono text-primary/70">{t('badges.earnedCheck')}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
