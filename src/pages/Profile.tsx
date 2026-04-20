import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { parseProfileLocationState, PROFILE_TAB_IDS, type ProfileTab } from '@/lib/router-location-state';
import { formatBtcPrice } from '@/lib/btc';
import { format } from 'date-fns';
import { Mail, Lock, Clock, Trash2, BarChart3, Sparkles, Award, CalendarDays, Info } from 'lucide-react';
import HistoryContent from '@/components/library/HistoryContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NoxHeaderMain } from '@/components/ui/nox-header';


import { DecisionQualityCard } from '@/components/DecisionQualityCard';
import { DecisionAccuracyCard } from '@/components/DecisionAccuracyCard';
import { ChartEmptyState } from '@/components/ChartEmptyState';
import { MilestoneTimeline } from '@/components/MilestoneTimeline';
import { JourneyWidget } from '@/components/JourneyWidget';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { ProLock } from '@/components/ProLock';
import { LetterViewer } from '@/components/LetterViewer';

import { BadgesPanel } from '@/components/BadgesPanel';
import { MoodPriceChart } from '@/components/MoodPriceChart';
import { MoodTrendChart } from '@/components/MoodTrendChart';
import { MoodPriceScatter } from '@/components/MoodPriceScatter';


import { StatsTrends } from '@/components/StatsTrends';
import { MoodShiftChart } from '@/components/MoodShiftChart';
import { PeriodComparison } from '@/components/PeriodComparison';
import { VolatilityToleranceCard } from '@/components/VolatilityToleranceCard';

import { ShareStats } from '@/components/ShareStats';
import { useHolzenScore } from '@/hooks/use-holzen-score';

import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Reflection {
  id: string;
  message: string;
  context: string | null;
  created_at: string;
  is_favorite: boolean;
  haiku: string | null;
  grounding_title: string | null;
  grounding_body: string | null;
  note: string | null;
  mood: string | null;
  mood_after: string | null;
  outcome: string | null;
  tags: string[];
  breathing_completed: boolean;
  haiku_read: boolean;
  grounding_read: boolean;
  signal_read?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
}

interface Letter {
  id: string;
  body: string;
  written_during: string;
  deliver_during: string;
  btc_price_at_write: number;
  written_at: string;
  delivered: boolean;
  delivered_at: string | null;
  btc_price_at_delivery: number | null;
  delivery_threshold: number | null;
}

interface PracticeEntry {
  id: string;
  created_at: string;
  type: string;
  mood: string | null;
  intensity: number | null;
  duration_seconds: number | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const location = useLocation();
  const { tab: locationTab, letterId: locationLetterId } = parseProfileLocationState(location.state);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [practiceEntries, setPracticeEntries] = useState<PracticeEntry[]>([]);
  const [holdGoal, setHoldGoal] = useState<{ type: string | null; targetMonths: number | null; targetPrice: number | null; start: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);
  const [tab, setTab] = useState<ProfileTab>(
    locationTab && PROFILE_TAB_IDS.includes(locationTab) ? locationTab : 'stats'
  );

  // Track whether we're waiting to open a letter from a notification
  const [letterViewerPending, setLetterViewerPending] = useState(!!locationLetterId);

  // Keep tab in sync with navigation state (important when already on /profile)
  useEffect(() => {
    if (locationTab && PROFILE_TAB_IDS.includes(locationTab)) {
      setTab(locationTab);
    }
  }, [locationTab]);

  // Handle opening a specific letter when navigation state changes on the same route
  useEffect(() => {
    if (!locationLetterId) {
      setLetterViewerPending(false);
      return;
    }

    const found = letters.find((l) => l.id === locationLetterId && l.delivered);
    if (found) {
      setViewingLetter(found);
      setLetterViewerPending(false);
      return;
    }

    if (lettersLoading) {
      setLetterViewerPending(true);
    } else {
      setLetterViewerPending(false);
    }
  }, [locationLetterId, letters, lettersLoading]);

  useEffect(() => {
    document.title = 'Holzen — Profile';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadReflections = async () => {
      const { data } = await (supabase
        .from('v_reflection_with_companions')
        .select('id, message, context, created_at, is_favorite, haiku, grounding_title, grounding_body, note, mood, mood_after, outcome, tags, breathing_completed, haiku_read, grounding_read, signal_read, signal_source, zoom_out_read, history_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000) as any);
      setReflections((data as unknown as Reflection[]) ?? []);
      setLoading(false);
    };
    const loadLetters = async () => {
      const { data } = await supabase
        .from('future_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('written_at', { ascending: false });
      const all = (data as unknown as Letter[]) ?? [];
      setLetters(all);
      // Open viewer immediately if navigating from notification
      if (locationLetterId) {
        const found = all.find((l) => l.id === locationLetterId && l.delivered);
        if (found) setViewingLetter(found);
        setLetterViewerPending(false);
      }
      setLettersLoading(false);
    };
    const loadPractice = async () => {
      const { data } = await supabase
        .from('practice_entries')
        .select('id, created_at, type, mood, intensity, duration_seconds')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setPracticeEntries((data as unknown as PracticeEntry[]) ?? []);
    };
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('hold_goal_type, hold_goal_target_months, hold_goal_target_price, hold_goal_start')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setHoldGoal({
          type: data.hold_goal_type,
          targetMonths: data.hold_goal_target_months,
          targetPrice: data.hold_goal_target_price,
          start: data.hold_goal_start,
        });
      }
    };
    loadReflections();
    loadLetters();
    loadPractice();
    loadProfile();
  }, [user]);

  const deleteLetter = useCallback(async (id: string) => {
    const { error } = await supabase.from('future_letters').delete().eq('id', id);
    if (error) {
      toast.error(t('letter.deleteDeliveredFailed'));
      return;
    }
    setLetters((prev) => prev.filter((l) => l.id !== id));
    toast(t('letter.deleted'));
  }, [t]);

  const pendingLetters = useMemo(() => letters.filter((l) => !l.delivered), [letters]);
  const deliveredLetters = useMemo(() => letters.filter((l) => l.delivered), [letters]);

  const { currency } = useHolzen();
  const fmtPrice = (p: number) => formatBtcPrice(p, currency);

  const tabs = [
    { id: 'stats' as const, label: t('profile.stats'), icon: BarChart3 },
    { id: 'insights' as const, label: t('profile.insights'), icon: Sparkles },
    { id: 'badges' as const, label: t('profile.badges'), icon: Award },
    { id: 'letters' as const, label: t('profile.letters'), icon: Mail, count: pendingLetters.length },
    { id: 'activity' as const, label: t('profile.activity'), icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <NoxHeaderMain title={t('nav.profile')} subtitle={t('profile.pageSubtitle')} />
      {/* Tab header */}
      <div className="tabs-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-xs uppercase tracking-wide transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'border border-border/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
              {tabItem.label}
              {tabItem.count && tabItem.count > 0 ? (
                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full leading-none font-medium">
                  {tabItem.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'stats' ? (
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : (
          <StatsContent reflections={reflections} practiceEntries={practiceEntries} letters={letters} memberSince={user?.created_at} holdGoal={holdGoal} />
        )
      ) : tab === 'insights' ? (
        <ProLock feature="ai_insights" hideContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : (
            <AIInsightsPanel reflectionCount={reflections.length} />
          )}
        </ProLock>
      ) : tab === 'badges' ? (
        loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : (
          <BadgesPanel reflections={reflections} subscribed={subscribed} />
        )
      ) : tab === 'activity' ? (
        <ProLock feature="history" hideContent>
          <HistoryContent />
        </ProLock>
      ) : (
        <ProLock feature="letters" hideContent>
          {lettersLoading || letterViewerPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : letters.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Mail className="h-5 w-5 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                {t('profile.noLettersYet')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingLetters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <p className="text-xs font-mono tracking-widest uppercase">
                      {t('profile.sealed')} ({pendingLetters.length})
                    </p>
                  </div>
                  {pendingLetters.map((l) => (
                    <LetterCard key={l.id} letter={l} onDelete={deleteLetter} fmtPrice={fmtPrice} type="sealed" />
                  ))}
                </div>
              )}
              {deliveredLetters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <p className="text-xs font-mono tracking-widest uppercase">
                      {t('profile.delivered')} ({deliveredLetters.length})
                    </p>
                  </div>
                  {deliveredLetters.map((l) => (
                    <LetterCard key={l.id} letter={l} onDelete={deleteLetter} fmtPrice={fmtPrice} type="delivered" onView={() => setViewingLetter(l)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </ProLock>
      )}

      <LetterViewer letter={viewingLetter} onClose={() => setViewingLetter(null)} />
    </div>
  );
};

function StatsContent({ reflections, practiceEntries = [], letters = [], memberSince, holdGoal }: { reflections: Reflection[]; practiceEntries?: PracticeEntry[]; letters?: Letter[]; memberSince?: string; holdGoal?: { type: string | null; targetMonths: number | null; targetPrice: number | null; start: string | null } | null }) {
  const { t } = useTranslation();
  const scoreData = useHolzenScore(reflections, [], practiceEntries, holdGoal);

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reflections) {
      if (r.mood) counts[r.mood] = (counts[r.mood] || 0) + 1;
    }
    // Include check-in moods
    for (const p of practiceEntries) {
      if (p.type === 'checkin' && p.mood) counts[p.mood] = (counts[p.mood] || 0) + 1;
    }
    return counts;
  }, [reflections, practiceEntries]);

  // Merge check-in moods into reflection-like objects for mood charts
  const moodDataForCharts = useMemo(() => {
    const reflectionMoods = reflections.map(r => ({ created_at: r.created_at, mood: r.mood }));
    const checkinMoods = practiceEntries
      .filter(p => p.type === 'checkin' && p.mood)
      .map(p => ({ created_at: p.created_at, mood: p.mood }));
    return [...reflectionMoods, ...checkinMoods];
  }, [reflections, practiceEntries]);

  const practiceDays = useMemo(() => {
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    return new Set(
      practiceEntries
        .filter(p => new Date(p.created_at) >= last30)
        .map(p => new Date(p.created_at).toISOString().slice(0, 10))
    ).size;
  }, [practiceEntries]);


  const practiceStats = useMemo(() => {
    if (practiceEntries.length === 0) return null;
    const byType: Record<string, number> = {};
    let totalSeconds = 0;
    for (const p of practiceEntries) {
      byType[p.type] = (byType[p.type] || 0) + 1;
      if (p.duration_seconds) totalSeconds += p.duration_seconds;
    }
    // Weekly counts for last 8 weeks (sparkline data)
    const weeks: number[] = Array(8).fill(0);
    const now = Date.now();
    for (const p of practiceEntries) {
      const age = Math.floor((now - new Date(p.created_at).getTime()) / (7 * 86400000));
      if (age < 8) weeks[7 - age]++;
    }
    return { total: practiceEntries.length, byType, totalSeconds, weeks };
  }, [practiceEntries]);

  // Compute current streak for summary
  // Activity days in last 30 days (replaces streak as a soft context metric)
  const activeDaysLast30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const days = new Set<string>();
    for (const r of reflections) {
      if (new Date(r.created_at) >= cutoff) days.add(new Date(r.created_at).toISOString().slice(0, 10));
    }
    for (const p of practiceEntries) {
      if (new Date(p.created_at) >= cutoff) days.add(new Date(p.created_at).toISOString().slice(0, 10));
    }
    return days.size;
  }, [reflections, practiceEntries]);

  // Score grade label
  const scoreGrade = scoreData
    ? scoreData.score >= 80 ? 'Composed'
    : scoreData.score >= 60 ? 'Steady'
    : scoreData.score >= 40 ? 'Building'
    : 'Starting'
    : null;

  const scoreColor = scoreData
    ? scoreData.score >= 80 ? 'text-primary'
    : scoreData.score >= 60 ? 'text-primary/70'
    : scoreData.score >= 40 ? 'text-muted-foreground'
    : 'text-muted-foreground/50'
    : 'text-muted-foreground/50';

  // Compute time context for reflections
  const firstReflection = reflections.length > 0 ? reflections[reflections.length - 1] : null;
  const daysSinceFirst = firstReflection
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstReflection.created_at).getTime()) / 86400000))
    : 0;
  const reflectionContext = daysSinceFirst <= 7
    ? `${daysSinceFirst}d`
    : daysSinceFirst <= 31
    ? `${Math.ceil(daysSinceFirst / 7)}w`
    : `${Math.ceil(daysSinceFirst / 30)}mo`;

  // Engaged pauses = breathing + mood + mood_after + outcome (the user actually paused).
  const engagedCount = reflections.filter(
    (r) => r.breathing_completed && r.mood && r.mood_after && r.outcome
  ).length;
  const generatedCount = reflections.length;

  const circumference = 2 * Math.PI * 44;
  const scoreOffset = scoreData ? circumference - (scoreData.score / 100) * circumference : circumference;

  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const hasHoldGoal = holdGoal?.type != null;

  return (
    <div className="space-y-6">
      {/* Hero score + merged summary */}
      <div className="relative rounded-md border border-border/60 bg-muted/30 px-0 py-5 space-y-4">
        {scoreData && (
          <button
            type="button"
            aria-label="Score info"
            onClick={() => setShowScoreInfo(true)}
            className="absolute top-2 right-2 rounded-full p-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Info className="h-5 w-5 text-secondary-foreground" />
          </button>
        )}
        <div className="flex items-center gap-5 px-[8px]">
          {/* Score ring — hero size */}
          <div className="relative shrink-0 cursor-pointer" onClick={() => scoreData && setShowScoreInfo(true)}>
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.3" />
              <circle
                cx="54" cy="54" r="44" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={scoreOffset}
                transform="rotate(-90 54 54)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-mono font-semibold leading-none">{scoreData?.score ?? '—'}</span>
              {scoreGrade && (
                <span className={`mt-0.5 text-sm font-sans font-normal ${scoreColor}`}>{scoreGrade}</span>
              )}
            </div>
          </div>

          {/* Summary metrics with micro-context */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <MicroStat
              value={engagedCount}
              label={t('profile.pauses', 'Pauses')}
              context={
                generatedCount > engagedCount
                  ? `${generatedCount} generated`
                  : reflectionContext ? `in ${reflectionContext}` : undefined
              }
            />
            <MicroStat
              value={activeDaysLast30}
              suffix="d"
              label={t('profile.activeDays', 'Active')}
              context="last 30d"
            />
            <MicroStat
              value={practiceDays}
              suffix="d"
              label={t('profile.practice', 'Practice')}
              context="this month"
            />
            <MicroStat
              value={scoreData?.trend === 'improving' ? '↑' : scoreData?.trend === 'declining' ? '↓' : '→'}
              label={t('profile.trend', 'Trend')}
              context={scoreData ? t(`holzenScore.${scoreData.trend}`) : undefined}
              isText
            />
          </div>
        </div>

        {/* Score component bars */}
        {scoreData && (
          <div className="space-y-4 pt-2 px-4 border-t border-border/30">
            <ScoreBarInline label={t('holzenScore.emotionalRegulation', 'Regulation')} value={scoreData.emotionalRegulation} hint={t('scoreHint.regulation', 'Mood improvement during pauses + breathing completion')} />
            <ScoreBarInline label={t('holzenScore.distressTolerance', 'Tolerance')} value={scoreData.distressTolerance} hint={t('scoreHint.tolerance', 'Holding steady during high volatility')} />
            {hasHoldGoal && <ScoreBarInline label={t('holzenScore.decisionAlignment', 'Alignment')} value={scoreData.decisionAlignment} hint={t('scoreHint.alignment', 'Actions aligned with your hold goal')} />}
            <ScoreBarInline label={t('holzenScore.cognitiveReappraisal', 'Reappraisal')} value={scoreData.cognitiveReappraisal} hint={t('scoreHint.reappraisal', 'Engaging perspective tools during pauses')} />
            <ScoreBarInline label={t('holzenScore.selfAwareness', 'Awareness')} value={scoreData.selfAwareness} hint={t('scoreHint.awareness', 'Notes, tags, favorites & completing full pause flow')} />
          </div>
        )}

        {!scoreData && (
          <p className="text-[10px] text-muted-foreground/40 font-mono text-center">
            {t('profile.holzenScoreEmpty', 'Log a pause with mood or outcome to generate your composure score.')}
          </p>
        )}
      </div>

      {/* Score explainer sheet */}
      <ScoreExplainerSheet open={showScoreInfo} onOpenChange={setShowScoreInfo} hasHoldGoal={hasHoldGoal} />

      <div className="flex items-center justify-end">
        <ShareStats
          reflectionCount={reflections.length}
          scoreData={scoreData}
          moodCounts={moodCounts}
        />
      </div>

      {/* Section: Your Journey */}
      <StatsSection label={t('profile.sectionJourney', 'Your Journey')}>
        <JourneyWidget reflections={reflections} practiceEntries={practiceEntries} memberSince={memberSince} />
        <MilestoneTimeline reflections={reflections} practiceEntries={practiceEntries} letters={letters} memberSince={memberSince} />
      </StatsSection>

      {/* Section: Progress */}
      <ProLock feature="decisions">
        <StatsSection label={t('profile.sectionProgress', 'Progress')}>
          <PeriodComparison reflections={reflections} holdGoal={holdGoal} />
          <StatsTrends reflections={reflections} />
          {practiceStats && (() => {
            const totalMin = Math.round(practiceStats.totalSeconds / 60);
            const maxW = Math.max(...practiceStats.weeks, 1);
            return (
              <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-3">
                <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
                  {t('profile.practiceActivity')}
                </p>
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-lg font-mono font-medium">{practiceStats.total}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/50 ml-1">{t('profile.sessions', 'sessions')}</span>
                  </div>
                  {totalMin > 0 && (
                    <div>
                      <span className="text-lg font-mono font-medium">{totalMin}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/50 ml-1">min</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-muted-foreground/40">{t('profile.last8Weeks', 'Last 8 weeks')}</p>
                  <div className="flex items-end gap-[3px] h-6">
                    {practiceStats.weeks.map((w, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/60 transition-all"
                        style={{ height: `${Math.max((w / maxW) * 100, w > 0 ? 12 : 4)}%`, opacity: w > 0 ? 1 : 0.15 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1 border-t border-border/30">
                  {Object.entries(practiceStats.byType).map(([type, count]) => (
                    <div key={type} className="text-center">
                      <p className="text-sm font-mono">{count}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/50 capitalize">{t(`practice.${type}Label`, type)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </StatsSection>
      </ProLock>

      {/* Section: Decision Making */}
      <ProLock feature="emotional_patterns">
        <StatsSection label={t('profile.sectionDecisions', 'Decision Making')}>
          <DecisionQualityCard reflections={reflections} />
          <DecisionAccuracyCard />
          <VolatilityToleranceCard reflections={reflections} />
        </StatsSection>
      </ProLock>

      {/* Section: Deep Patterns */}
      <ProLock feature="advanced_stats">
        <StatsSection label={t('profile.sectionDeepPatterns', 'Deep Patterns')}>
          <MoodShiftChart reflections={reflections} />
          <MoodTrendChart reflections={moodDataForCharts} />
          <MoodPriceChart reflections={reflections} />
          <MoodPriceScatter reflections={reflections} />
        </StatsSection>
      </ProLock>
    </div>
  );
}

function MicroStat({ value, suffix, label, context, isText }: {
  value: string | number;
  suffix?: string;
  label: string;
  context?: string;
  isText?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1 flex-wrap">
      <span className={`font-sans font-medium leading-none text-primary ${isText ? 'text-base' : 'text-lg'}`}>
        {value}{suffix && <span className="ml-0.5 text-sm" style={{ color: '#C1CBD7' }}>{suffix}</span>}
      </span>
      <span className="lowercase font-sans font-medium text-sm" style={{ color: '#C1CBD7' }}>{label}</span>
      {context && (
        <span className="font-sans text-sm font-normal" style={{ color: '#C1CBD7' }}>{context}</span>
      )}
    </div>
  );
}

function ScoreBarInline({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2 cursor-pointer" onClick={() => hint && setOpen(!open)}>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span className="font-sans text-base text-secondary-foreground font-normal">{label}</span>
        <span className="text-sm font-sans text-secondary-foreground">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out" style={{ width: `${value}%` }} />
      </div>
      {open && hint && (
        <p className="leading-relaxed pt-0.5 animate-in fade-in duration-200 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function StatsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="tracking-widest uppercase border-b border-border/40 pb-1.5 text-sm font-sans font-normal text-[#dbb266]">
        {label}
      </p>
      {children}
    </div>
  );
}
function LetterCard({ letter: l, onDelete, fmtPrice, type, onView }: {
  letter: Letter;
  onDelete: (id: string) => void;
  fmtPrice: (p: number) => string;
  type: 'sealed' | 'delivered';
  onView?: () => void;
}) {
  const { t } = useTranslation();
  const isDelivered = type === 'delivered';

  return (
    <div
      className={`rounded-md border px-4 py-3 space-y-2 ${
        isDelivered ? 'border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/8 transition-colors' : 'border-border/60 bg-muted/30'
      }`}
      onClick={isDelivered && onView ? onView : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        {isDelivered ? (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-primary" />
            <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
              Delivered {l.delivered_at ? format(new Date(l.delivered_at), 'MMM d, yyyy') : ''}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>
              Written {format(new Date(l.written_at), 'MMM d, yyyy')}{' '}
              {l.written_during === 'calm' ? 'during calm markets' : l.written_during === 'crash' ? 'during a drop' : 'during a surge'}{' '}
              at {fmtPrice(l.btc_price_at_write)}
            </span>
          </div>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1" aria-label="Delete letter">
              <Trash2 className="h-3 w-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-mono text-sm">Delete {type} letter</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                This will permanently delete this letter.{!isDelivered && ' It will never be delivered.'} This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(l.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {isDelivered ? (
        <>
          <p className="text-sm leading-relaxed break-words">{l.body}</p>
          <p className="text-[10px] font-mono text-muted-foreground/50">
            Written {format(new Date(l.written_at), 'MMM d, yyyy')} at {fmtPrice(l.btc_price_at_write)}
            {l.btc_price_at_delivery && ` · Delivered at ${fmtPrice(l.btc_price_at_delivery)}`}
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground/50">
            Delivers during next {l.deliver_during === 'surge' ? 'surge' : 'drop'}
          </p>
          <p className="text-sm leading-relaxed blur-[8px] select-none pointer-events-none break-words">
            {l.body}
          </p>
        </>
      )}
    </div>
  );
}

function ScoreExplainerSheet({ open, onOpenChange, hasHoldGoal }: { open: boolean; onOpenChange: (v: boolean) => void; hasHoldGoal: boolean }) {
  const { t } = useTranslation();

  const components = [
    {
      label: t('holzenScore.emotionalRegulation', 'Regulation'),
      weight: hasHoldGoal ? '30%' : '37%',
      desc: t('scoreExplainer.regulation', 'Measures mood improvement between the Feel and Shift steps of each pause. Breathing completion adds a bonus.'),
    },
    {
      label: t('holzenScore.distressTolerance', 'Tolerance'),
      weight: hasHoldGoal ? '25%' : '31%',
      desc: t('scoreExplainer.tolerance', 'Rewards holding or doing nothing during high volatility. Selling during volatile moments lowers this score.'),
    },
    ...(hasHoldGoal ? [{
      label: t('holzenScore.decisionAlignment', 'Alignment'),
      weight: '20%',
      desc: t('scoreExplainer.alignment', 'How well your actions align with your hold goal. Holding scores highest, selling scores lowest.'),
    }] : []),
    {
      label: t('holzenScore.cognitiveReappraisal', 'Reappraisal'),
      weight: hasHoldGoal ? '15%' : '19%',
      desc: t('scoreExplainer.reappraisal', 'Engaging with perspective tools (Zoom Out, History, Signal, Learning) during a pause. Extra credit during volatile moments.'),
    },
    {
      label: t('holzenScore.selfAwareness', 'Awareness'),
      weight: hasHoldGoal ? '10%' : '13%',
      desc: t('scoreExplainer.awareness', 'Depth of reflection: writing notes, adding tags, marking favorites, and completing the full pause flow.'),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-sm font-mono tracking-wider uppercase">
            {t('scoreExplainer.title', 'How your score works')}
          </SheetTitle>
        </SheetHeader>

        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {t('scoreExplainer.intro', 'Your composure score (0–100) is calculated from your last 30 pauses. It measures skills, not feelings — how well you regulate emotions and make aligned decisions under pressure.')}
        </p>

        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium">{c.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60">{c.weight}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        {!hasHoldGoal && (
          <p className="text-[10px] text-muted-foreground/40 mt-4 leading-relaxed">
            {t('scoreExplainer.noGoalNote', 'Set a hold goal to unlock the Alignment component and get a more complete score.')}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default Profile;
