import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { formatBtcPrice } from '@/lib/btc';
import { format } from 'date-fns';
import { Mail, Lock, Clock, Trash2 } from 'lucide-react';
import HistoryContent from '@/components/library/HistoryContent';
import { Skeleton } from '@/components/ui/skeleton';
import { ReflectionStats } from '@/components/ReflectionStats';
import { InsightsPanel } from '@/components/InsightsPanel';
import { DecisionQualityCard } from '@/components/DecisionQualityCard';
import { ChartEmptyState } from '@/components/ChartEmptyState';
import { StreakTimeline } from '@/components/StreakTimeline';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { ProLock } from '@/components/ProLock';

import { BadgesPanel } from '@/components/BadgesPanel';
import { MoodPriceChart } from '@/components/MoodPriceChart';
import { MoodTrendChart } from '@/components/MoodTrendChart';
import { MoodPriceScatter } from '@/components/MoodPriceScatter';
import { RitualStatsCard } from '@/components/RitualStatsCard';

import { StatsTrends } from '@/components/StatsTrends';
import { PeriodComparison } from '@/components/PeriodComparison';
import { VolatilityToleranceCard } from '@/components/VolatilityToleranceCard';
import { ShareStats } from '@/components/ShareStats';
import { useHolzenScore } from '@/hooks/use-holzen-score';
import { HolzenScoreCard } from '@/components/HolzenScoreCard';
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
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [practiceEntries, setPracticeEntries] = useState<PracticeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'insights' | 'badges' | 'letters' | 'activity'>(
    ['stats', 'insights', 'badges', 'letters', 'activity'].includes(locationTab) ? locationTab : 'stats'
  );

  useEffect(() => {
    document.title = 'Holzen — Profile';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadReflections = async () => {
      const { data } = await supabase
        .from('reflections')
        .select('id, message, context, created_at, is_favorite, haiku, learning_title, learning_body, note, mood, outcome, tags, breathing_completed, haiku_read, learning_read, signal_read, signal_source, zoom_out_read, history_read')
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
      setLetters((data as unknown as Letter[]) ?? []);
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
    { id: 'stats' as const, label: t('profile.stats') },
    { id: 'insights' as const, label: t('profile.insights') },
    { id: 'badges' as const, label: t('profile.badges') },
    { id: 'letters' as const, label: t('profile.letters'), count: pendingLetters.length },
    { id: 'activity' as const, label: t('profile.activity') },
  ];

  return (
    <div className="space-y-6">
      {/* Tab header */}
      <div className="space-y-4">
        <div className="flex items-center gap-5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-sm font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${
                tab === t.id ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {t.label}
              {t.count && t.count > 0 ? (
                <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
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
        <ProLock>
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
          <BadgesPanel reflections={reflections} />
        )
      ) : tab === 'activity' ? (
        <ProLock>
          <HistoryContent />
        </ProLock>
      ) : (
        <ProLock>
          {lettersLoading ? (
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
                    <LetterCard key={l.id} letter={l} onDelete={deleteLetter} fmtPrice={fmtPrice} type="delivered" />
                  ))}
                </div>
              )}
            </div>
          )}
        </ProLock>
      )}
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

  return (
    <div className="space-y-5">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
        {t('profile.overview')}
      </p>
      <ReflectionStats reflections={reflections} />
      <StreakTimeline reflections={reflections} practiceEntries={practiceEntries} memberSince={memberSince} />

      {/* Practice summary */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          {t('profile.practiceActivity')}
        </p>
        {practiceStats ? (
          <div className="flex flex-wrap gap-3">
            {Object.entries(practiceStats.byType).map(([type, count]) => (
              <div key={type} className="text-center">
                <p className="text-sm font-mono">{count}</p>
                <p className="text-[9px] font-mono text-muted-foreground/50 capitalize">{t(`practice.${type}Label`, type)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">{t('profile.noPracticeYet', 'No practice sessions yet. Try a check-in or body scan from the Home screen.')}</p>
        )}
      </div>

      {/* Pro-gated advanced stats */}
      <ProLock>
        <div className="space-y-5">
          <div className="flex items-center justify-end">
            <ShareStats
              reflectionCount={reflections.length}
              scoreData={scoreData}
              moodCounts={moodCounts}
            />
          </div>
          {scoreData ? <HolzenScoreDetail scoreData={scoreData} practiceDays={practiceDays} /> : (
            <ChartEmptyState
              title={t('profile.holzenScore')}
              message={t('profile.holzenScoreEmpty')}
              current={reflections.length}
              needed={1}
            />
          )}
          <PeriodComparison reflections={reflections} />
          <InsightsPanel reflections={reflections} />
          <DecisionQualityCard reflections={reflections} />
          <VolatilityToleranceCard reflections={reflections} />
          <RitualStatsCard />
          <StatsTrends reflections={reflections} />
          <MoodTrendChart reflections={moodDataForCharts} />
          <MoodPriceChart reflections={reflections} />
          <MoodPriceScatter reflections={reflections} />
        </div>
      </ProLock>
    </div>
  );
}

function HolzenScoreDetail({ scoreData, practiceDays }: { scoreData: import('@/hooks/use-holzen-score').HolzenScoreData; practiceDays: number }) {
  const { t } = useTranslation();
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (scoreData.score / 100) * circumference;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">{t('profile.holzenScore')}</p>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.3" />
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 44 44)" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-mono font-medium">{scoreData.score}</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <ScoreBarInline label={t('profile.moodLabel')} value={scoreData.moodScore} />
          <ScoreBarInline label={t('profile.actionsLabel')} value={scoreData.outcomeScore} />
          <ScoreBarInline label={t('profile.streakLabel')} value={scoreData.streakScore} />
          <ScoreBarInline
            label={t('profile.practiceLabel')}
            value={scoreData.practiceScore}
            detail={t('holzenScore.practiceDays', '{{count}} days this month', { count: practiceDays })}
          />
        </div>
      </div>
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

function LetterCard({ letter: l, onDelete, fmtPrice, type }: {
  letter: Letter;
  onDelete: (id: string) => void;
  fmtPrice: (p: number) => string;
  type: 'sealed' | 'delivered';
}) {
  const { t } = useTranslation();
  const isDelivered = type === 'delivered';

  return (
    <div className={`rounded-md border px-4 py-3 space-y-2 ${
      isDelivered ? 'border-primary/20 bg-primary/5' : 'border-border/60 bg-muted/30'
    }`}>
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
