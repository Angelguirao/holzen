import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { formatBtcPrice } from '@/lib/btc';
import { format } from 'date-fns';
import { Mail, Lock, Clock, Trash2, BarChart3, Sparkles, Award, CalendarDays } from 'lucide-react';
import HistoryContent from '@/components/library/HistoryContent';
import { Skeleton } from '@/components/ui/skeleton';


import { DecisionQualityCard } from '@/components/DecisionQualityCard';
import { ChartEmptyState } from '@/components/ChartEmptyState';
import { StreakTimeline } from '@/components/StreakTimeline';
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
import { SkillBalanceCard } from '@/components/SkillBalanceCard';
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
  learning_title: string | null;
  learning_body: string | null;
  note: string | null;
  mood: string | null;
  mood_after: string | null;
  outcome: string | null;
  tags: string[];
  breathing_completed: boolean;
  haiku_read: boolean;
  learning_read: boolean;
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
  const locationTab = (location.state as any)?.tab;
  const locationLetterId = (location.state as any)?.letterId;
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [practiceEntries, setPracticeEntries] = useState<PracticeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);
  const [tab, setTab] = useState<'stats' | 'insights' | 'badges' | 'letters' | 'activity'>(
    ['stats', 'insights', 'badges', 'letters', 'activity'].includes(locationTab) ? locationTab : 'stats'
  );

  // Track whether we're waiting to open a letter from a notification
  const [letterViewerPending, setLetterViewerPending] = useState(!!locationLetterId);

  // Keep tab in sync with navigation state (important when already on /profile)
  useEffect(() => {
    if (locationTab && ['stats', 'insights', 'badges', 'letters', 'activity'].includes(locationTab)) {
      setTab(locationTab as 'stats' | 'insights' | 'badges' | 'letters' | 'activity');
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
      const { data } = await supabase
        .from('reflections')
        .select('id, message, context, created_at, is_favorite, haiku, learning_title, learning_body, note, mood, mood_after, outcome, tags, breathing_completed, haiku_read, learning_read, signal_read, signal_source, zoom_out_read, history_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
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
    loadReflections();
    loadLetters();
    loadPractice();
  }, [user]);

  const deleteLetter = useCallback(async (id: string) => {
    try {
      await supabase.from('future_letters').delete().eq('id', id);
      setLetters((prev) => prev.filter((l) => l.id !== id));
      toast('Letter deleted');
    } catch {
      toast('Failed to delete letter');
    }
  }, []);

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
      {/* Tab header */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
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
          <StatsContent reflections={reflections} practiceEntries={practiceEntries} memberSince={user?.created_at} />
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
                    <p className="text-[10px] font-mono tracking-widest uppercase">
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
                    <p className="text-[10px] font-mono tracking-widest uppercase">
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

function StatsContent({ reflections, practiceEntries = [], memberSince }: { reflections: Reflection[]; practiceEntries?: PracticeEntry[]; memberSince?: string }) {
  const { t } = useTranslation();
  const scoreData = useHolzenScore(reflections, [], practiceEntries);

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
    for (const p of practiceEntries) {
      byType[p.type] = (byType[p.type] || 0) + 1;
    }
    return { total: practiceEntries.length, byType };
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

  const circumference = 2 * Math.PI * 44;
  const scoreOffset = scoreData ? circumference - (scoreData.score / 100) * circumference : circumference;

  return (
    <div className="space-y-6">
      {/* Hero score + merged summary */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-5 space-y-4">
        <div className="flex items-center gap-5">
          {/* Score ring — hero size */}
          <div className="relative shrink-0">
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
                <span className={`text-[9px] font-mono mt-0.5 ${scoreColor}`}>{scoreGrade}</span>
              )}
            </div>
          </div>

          {/* Summary metrics with micro-context */}
          <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-3">
            <MicroStat
              value={reflections.length}
              label={t('profile.reflections', 'Reflects')}
              context={reflectionContext ? `in ${reflectionContext}` : undefined}
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
          <div className="space-y-1.5 pt-2 border-t border-border/30">
            <ScoreBarInline label={t('holzenScore.emotionalRegulation', 'Regulation')} value={scoreData.emotionalRegulation} />
            <ScoreBarInline label={t('holzenScore.distressTolerance', 'Tolerance')} value={scoreData.distressTolerance} />
            <ScoreBarInline label={t('holzenScore.decisionAlignment', 'Alignment')} value={scoreData.decisionAlignment} />
            <ScoreBarInline label={t('holzenScore.cognitiveReappraisal', 'Reappraisal')} value={scoreData.cognitiveReappraisal} />
            <ScoreBarInline label={t('holzenScore.selfAwareness', 'Awareness')} value={scoreData.selfAwareness} />
          </div>
        )}

        {!scoreData && (
          <p className="text-[10px] text-muted-foreground/40 font-mono text-center">
            {t('profile.holzenScoreEmpty', 'Log 3 reflections with mood or outcome to generate your composure score.')}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <ShareStats
          reflectionCount={reflections.length}
          scoreData={scoreData}
          moodCounts={moodCounts}
        />
      </div>

      {/* Section: Your Journey — without redundant ReflectionStats tiles */}
      <StatsSection label={t('profile.sectionJourney', 'Your Journey')}>
        <StreakTimeline reflections={reflections} practiceEntries={practiceEntries} memberSince={memberSince} />
      </StatsSection>
      {/* Section: Emotional Patterns */}
      <ProLock feature="emotional_patterns">
        <StatsSection label={t('profile.sectionEmotional', 'Emotional Patterns')}>
          <MoodTrendChart reflections={moodDataForCharts} />
          <MoodPriceChart reflections={reflections} />
        </StatsSection>
      </ProLock>

      {/* Section: Decision Making */}
      <ProLock feature="decisions">
        <StatsSection label={t('profile.sectionDecisions', 'Decision Making')}>
          <SkillBalanceCard reflections={reflections} />
          <PeriodComparison reflections={reflections} />
          <DecisionQualityCard reflections={reflections} />
          <VolatilityToleranceCard reflections={reflections} />
          <InsightsPanel reflections={reflections} />
        </StatsSection>
      </ProLock>

      {/* Section: Practice */}
      <ProLock feature="practice_stats">
        <StatsSection label={t('profile.sectionPractice', 'Practice')}>
          {practiceStats ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
              <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                {t('profile.practiceActivity')}
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(practiceStats.byType).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <p className="text-sm font-mono">{count}</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50 capitalize">{t(`practice.${type}Label`, type)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ChartEmptyState
              title={t('profile.practiceActivity')}
              message={t('profile.noPracticeYet', 'No practice sessions yet. Try a check-in or body scan from the Home screen.')}
              current={0}
              needed={1}
            />
          )}
        </StatsSection>
      </ProLock>

      {/* Section: Advanced */}
      <ProLock feature="advanced_stats">
        <StatsSection label={t('profile.sectionAdvanced', 'Advanced')}>
          <StatsTrends reflections={reflections} />
          <MoodShiftChart reflections={reflections} />
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
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-medium leading-none ${isText ? 'text-base' : 'text-lg'}`}>
          {value}{suffix && <span className="text-[10px] text-muted-foreground/50 ml-0.5">{suffix}</span>}
        </span>
        {context && (
          <span className="text-[9px] font-mono text-muted-foreground/40">{context}</span>
        )}
      </div>
      <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/50">{label}</p>
    </div>
  );
}

function ScoreBarInline({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{label}</span>
        <span className="flex items-center gap-1.5">
          {detail && <span className="text-muted-foreground/40">{detail}</span>}
          <span>{value}</span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground border-b border-border/40 pb-1.5">
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
          <p className="text-sm leading-relaxed">{l.body}</p>
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
          <p className="text-sm leading-relaxed blur-[8px] select-none pointer-events-none">
            {l.body}
          </p>
        </>
      )}
    </div>
  );
}

export default Profile;
