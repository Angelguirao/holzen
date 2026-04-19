import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseISO } from 'date-fns';
import { Flame, MessageSquare, Shield, Eye, Heart, Award, Target, Wind, BookOpen, Feather, Radio, Telescope, Landmark, Lock, Sparkles, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { BadgeCelebration } from './BadgeCelebration';
import { useBadgeSync } from '@/hooks/use-badge-sync';


interface Reflection {
  id: string;
  created_at: string;
  mood: string | null;
  mood_after?: string | null;
  outcome: string | null;
  is_favorite: boolean;
  note: string | null;
  breathing_completed?: boolean;
  haiku_read?: boolean;
  grounding_read?: boolean;
  signal_source?: string | null;
  zoom_out_read?: boolean;
  history_read?: boolean;
}

interface Badge {
  id: string;
  labelKey: string;
  descKey: string;
  icon: typeof Flame;
  category: 'calendar' | 'volume' | 'composure' | 'engagement' | 'companions';
  color: string;
  earned: boolean;
  progress: number;
  requirement: number;
  current: number;
  unitKey: string;
  proOnly: boolean;
}

// Bitcoin Calendar dates (month is 0-indexed)
const BTC_CALENDAR_DATES = [
  { id: 'genesis', month: 0, day: 3 },      // Jan 3 — Genesis Block
  { id: 'birthday', month: 0, day: 9 },      // Jan 9 — First Bitcoin release
  { id: 'pizza', month: 4, day: 22 },         // May 22 — Pizza Day
  { id: 'whitepaper', month: 9, day: 31 },    // Oct 31 — Whitepaper Day
] as const;

// Known halving dates
const HALVING_DATES = [
  '2012-11-28', '2016-07-09', '2020-05-11', '2024-04-20',
  // Future approximations
  '2028-04-15', '2032-04-15',
];

function countCalendarBadge(reflections: Reflection[], month: number, day: number): number {
  return reflections.filter((r) => {
    const d = parseISO(r.created_at);
    return d.getMonth() === month && d.getDate() === day;
  }).length > 0 ? 1 : 0;
}

function countHalvingBadge(reflections: Reflection[]): number {
  // Check if user paused within ±3 days of any halving
  return reflections.filter((r) => {
    const refDate = parseISO(r.created_at);
    return HALVING_DATES.some((hd) => {
      const halvDate = new Date(hd);
      const diff = Math.abs(refDate.getTime() - halvDate.getTime());
      return diff <= 3 * 24 * 60 * 60 * 1000; // within 3 days
    });
  }).length > 0 ? 1 : 0;
}

interface BadgesPanelProps {
  reflections: Reflection[];
  subscribed: boolean;
  notifyBadges?: boolean;
}

export function BadgesPanel({ reflections, subscribed, notifyBadges = true }: BadgesPanelProps) {
  const { t } = useTranslation();

  const badges = useMemo(() => {
    // Volume = engaged pauses only (breathing + mood + mood_after + outcome).
    // Generated-but-ignored reflections don't count toward badges.
    const engaged = reflections.filter(
      (r) => r.breathing_completed && r.mood && r.mood_after && r.outcome
    );
    const total = engaged.length;
    const calmCount = reflections.filter((r) => r.mood === 'calm').length;
    const heldCount = reflections.filter((r) => r.outcome === 'held' || r.outcome === 'nothing').length;
    const favCount = reflections.filter((r) => r.is_favorite).length;
    const noteCount = reflections.filter((r) => r.note).length;
    const breathingCount = reflections.filter((r) => r.breathing_completed).length;
    const haikuCount = reflections.filter((r) => r.haiku_read).length;
    const groundCount = reflections.filter((r) => r.grounding_read).length;
    const signalCount = reflections.filter((r) => !!r.signal_source).length;
    const zoomOutCount = reflections.filter((r) => r.zoom_out_read).length;
    const historyCount = reflections.filter((r) => r.history_read).length;
    const allSixCount = reflections.filter(
      (r) => r.breathing_completed && r.haiku_read && r.grounding_read && !!r.signal_source && r.zoom_out_read && r.history_read
    ).length;

    // Bitcoin Calendar counts
    const genesisCount = countCalendarBadge(reflections, 0, 3);
    const birthdayCount = countCalendarBadge(reflections, 0, 9);
    const pizzaCount = countCalendarBadge(reflections, 4, 22);
    const whitepaperCount = countCalendarBadge(reflections, 9, 31);
    const halvingCount = countHalvingBadge(reflections);

    const makeBadge = (
      id: string,
      labelKey: string,
      descKey: string,
      icon: typeof Flame,
      category: Badge['category'],
      color: string,
      current: number,
      requirement: number,
      unitKey: string,
      proOnly: boolean = false
    ): Badge => ({
      id, labelKey, descKey, icon, category, color,
      earned: current >= requirement,
      progress: Math.min(current / requirement, 1),
      requirement, current, unitKey, proOnly,
    });

    return [
      // Bitcoin Calendar badges
      makeBadge('btc-genesis', 'badges.genesis', 'badges.genesisDesc', Calendar, 'calendar', 'hsl(35, 65%, 55%)', genesisCount, 1, 'badges.units.event'),
      makeBadge('btc-birthday', 'badges.birthday', 'badges.birthdayDesc', Calendar, 'calendar', 'hsl(25, 70%, 52%)', birthdayCount, 1, 'badges.units.event'),
      makeBadge('btc-pizza', 'badges.pizza', 'badges.pizzaDesc', Calendar, 'calendar', 'hsl(40, 75%, 55%)', pizzaCount, 1, 'badges.units.event'),
      makeBadge('btc-whitepaper', 'badges.whitepaper', 'badges.whitepaperDesc', Calendar, 'calendar', 'hsl(45, 60%, 50%)', whitepaperCount, 1, 'badges.units.event'),
      makeBadge('btc-halving', 'badges.halving', 'badges.halvingDesc', Calendar, 'calendar', 'hsl(15, 80%, 50%)', halvingCount, 1, 'badges.units.event'),

      // Volume
      makeBadge('reflect-10', 'badges.reflect10', 'badges.reflect10Desc', MessageSquare, 'volume', 'hsl(200, 50%, 50%)', total, 10, 'badges.units.pauses'),
      makeBadge('reflect-50', 'badges.reflect50', 'badges.reflect50Desc', MessageSquare, 'volume', 'hsl(210, 55%, 45%)', total, 50, 'badges.units.pauses'),
      makeBadge('reflect-100', 'badges.reflect100', 'badges.reflect100Desc', MessageSquare, 'volume', 'hsl(220, 60%, 40%)', total, 100, 'badges.units.pauses'),
      makeBadge('reflect-500', 'badges.reflect500', 'badges.reflect500Desc', MessageSquare, 'volume', 'hsl(230, 65%, 35%)', total, 500, 'badges.units.pauses'),

      // Composure
      makeBadge('calm-10', 'badges.calm10', 'badges.calm10Desc', Shield, 'composure', 'hsl(150, 40%, 45%)', calmCount, 10, 'badges.units.calmMoods'),
      makeBadge('calm-50', 'badges.calm50', 'badges.calm50Desc', Shield, 'composure', 'hsl(160, 45%, 40%)', calmCount, 50, 'badges.units.calmMoods'),
      makeBadge('held-10', 'badges.held10', 'badges.held10Desc', Target, 'composure', 'hsl(170, 40%, 42%)', heldCount, 10, 'badges.units.holds'),
      makeBadge('held-50', 'badges.held50', 'badges.held50Desc', Target, 'composure', 'hsl(180, 45%, 38%)', heldCount, 50, 'badges.units.holds'),

      // Companions (Pro)
      makeBadge('breathe-5', 'badges.breathe5', 'badges.breathe5Desc', Wind, 'companions', 'hsl(190, 50%, 50%)', breathingCount, 5, 'badges.units.sessions', true),
      makeBadge('breathe-25', 'badges.breathe25', 'badges.breathe25Desc', Wind, 'companions', 'hsl(195, 55%, 45%)', breathingCount, 25, 'badges.units.sessions', true),
      makeBadge('breathe-100', 'badges.breathe100', 'badges.breathe100Desc', Wind, 'companions', 'hsl(200, 60%, 40%)', breathingCount, 100, 'badges.units.sessions', true),
      makeBadge('haiku-10', 'badges.haiku10', 'badges.haiku10Desc', Feather, 'companions', 'hsl(280, 40%, 50%)', haikuCount, 10, 'badges.units.haiku', true),
      makeBadge('haiku-50', 'badges.haiku50', 'badges.haiku50Desc', Feather, 'companions', 'hsl(285, 45%, 45%)', haikuCount, 50, 'badges.units.haiku', true),
      makeBadge('learn-10', 'badges.learn10', 'badges.learn10Desc', BookOpen, 'companions', 'hsl(45, 50%, 48%)', groundCount, 10, 'badges.units.sessions', true),
      makeBadge('learn-50', 'badges.learn50', 'badges.learn50Desc', BookOpen, 'companions', 'hsl(50, 55%, 43%)', groundCount, 50, 'badges.units.sessions', true),
      makeBadge('signal-10', 'badges.signal10', 'badges.signal10Desc', Radio, 'companions', 'hsl(30, 50%, 48%)', signalCount, 10, 'badges.units.signals', true),
      makeBadge('signal-50', 'badges.signal50', 'badges.signal50Desc', Radio, 'companions', 'hsl(35, 55%, 43%)', signalCount, 50, 'badges.units.signals', true),
      makeBadge('zoom-5', 'badges.zoom5', 'badges.zoom5Desc', Telescope, 'companions', 'hsl(240, 45%, 50%)', zoomOutCount, 5, 'badges.units.sessions', true),
      makeBadge('zoom-25', 'badges.zoom25', 'badges.zoom25Desc', Telescope, 'companions', 'hsl(245, 50%, 45%)', zoomOutCount, 25, 'badges.units.sessions', true),
      makeBadge('history-5', 'badges.history5', 'badges.history5Desc', Landmark, 'companions', 'hsl(60, 40%, 48%)', historyCount, 5, 'badges.units.insights', true),
      makeBadge('history-25', 'badges.history25', 'badges.history25Desc', Landmark, 'companions', 'hsl(65, 45%, 43%)', historyCount, 25, 'badges.units.insights', true),
      makeBadge('all-6-5', 'badges.allSix5', 'badges.allSix5Desc', Award, 'companions', 'hsl(310, 45%, 48%)', allSixCount, 5, 'badges.units.fullSessions', true),
      makeBadge('all-6-25', 'badges.allSix25', 'badges.allSix25Desc', Award, 'companions', 'hsl(315, 50%, 43%)', allSixCount, 25, 'badges.units.fullSessions', true),

      // Engagement (Pro)
      makeBadge('fav-5', 'badges.fav5', 'badges.fav5Desc', Heart, 'engagement', 'hsl(340, 50%, 50%)', favCount, 5, 'badges.units.favorites', true),
      makeBadge('fav-25', 'badges.fav25', 'badges.fav25Desc', Heart, 'engagement', 'hsl(345, 55%, 45%)', favCount, 25, 'badges.units.favorites', true),
      makeBadge('notes-10', 'badges.notes10', 'badges.notes10Desc', Eye, 'engagement', 'hsl(270, 40%, 50%)', noteCount, 10, 'badges.units.notes', true),
      makeBadge('notes-50', 'badges.notes50', 'badges.notes50Desc', Eye, 'engagement', 'hsl(275, 45%, 45%)', noteCount, 50, 'badges.units.notes', true),
    ];
  }, [reflections]);

  const visibleBadges = subscribed ? badges : badges.filter((b) => !b.proOnly);
  const earnedCount = badges.filter((b) => b.earned).length;
  const proLockedCount = subscribed ? 0 : badges.filter((b) => b.proOnly).length;
  const categories = ['calendar', 'volume', 'composure', 'companions', 'engagement'] as const;

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
            <p className="text-muted-foreground font-sans text-sm">
              <span className="text-foreground font-medium">{earnedCount}</span> / {badges.length} {t('badges.earned')}
              {proLockedCount > 0 && (
                <span className="ml-1 text-muted-foreground">
                  · {proLockedCount} <Lock className="inline h-2.5 w-2.5 -mt-0.5 text-[#dbb266]" />
                </span>
              )}
            </p>
          </div>
          <div className="h-1.5 flex-1 max-w-[120px] ml-4 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(earnedCount / badges.length) * 100}%`, backgroundColor: '#C1CBD7' }}
            />
          </div>
        </div>
        {nextBadge && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
            <nextBadge.icon className="h-3 w-3 text-secondary-foreground" style={{ color: nextBadge.color }} />
            <span className="text-sm font-sans">
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
              <p className="tracking-widest uppercase text-sm font-sans text-[#dbb266]">
                {t(`badges.categories.${cat}`)}
              </p>
              <p className="text-base font-sans text-muted-foreground">
                {catEarned}/{catBadges.length}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {catBadges.map((badge, i) => {
                const isLocked = badge.proOnly && !subscribed;
                return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`relative rounded-lg border px-3 py-3 space-y-2 transition-all ${
                    isLocked
                      ? 'border-border/30 bg-muted/10 opacity-40'
                      : badge.earned
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/40 bg-muted/20 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="gap-2 min-w-0 flex items-start justify-start mt-0 pt-0">
                      <badge.icon
                        className="h-3.5 w-3.5 shrink-0 mt-0.5"
                        style={{ color: badge.earned && !isLocked ? badge.color : undefined }}
                      />
                      <p className={`leading-tight text-sm font-sans font-medium ${badge.earned && !isLocked ? 'text-secondary-foreground' : 'text-secondary-foreground/70'}`}>
                        {t(badge.labelKey)}
                      </p>
                    </div>
                    {badge.proOnly && (
                      <div className="flex items-center shrink-0">
                        {isLocked ? (
                          <Lock className="h-2.5 w-2.5 text-[#dbb266]" />
                        ) : (
                          <Sparkles className="h-2.5 w-2.5 text-primary/50" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="leading-snug text-xs text-muted-foreground">
                    {isLocked ? t('badges.proExclusive', 'Unlock with Pro') : t(badge.descKey)}
                  </p>

                  {!badge.earned && !isLocked && (
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: '#C1CBD7' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${badge.progress * 100}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        />
                      </div>
                      <p className="text-sm font-sans font-normal text-secondary-foreground">
                        {badge.current} / {badge.requirement} {t(badge.unitKey)}
                      </p>
                    </div>
                  )}

                  {badge.earned && !isLocked && (
                    <p className="text-[9px] font-mono text-primary/70">{t('badges.earnedCheck')}</p>
                  )}
                </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
