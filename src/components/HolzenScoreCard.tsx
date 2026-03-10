import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzenScore } from '@/hooks/use-holzen-score';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HolzenScoreCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reflections, setReflections] = useState<{ created_at: string; mood: string | null; mood_after?: string | null; outcome: string | null }[]>([]);
  const [practiceEntries, setPracticeEntries] = useState<{ created_at: string; type: string; mood: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from('reflections')
        .select('created_at, mood, outcome')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('practice_entries')
        .select('created_at, type, mood')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
    ]).then(([refRes, pracRes]) => {
      setReflections(refRes.data ?? []);
      setPracticeEntries((pracRes.data as any[]) ?? []);
      setLoaded(true);
    });
  }, [user]);

  const scoreData = useHolzenScore(reflections, [], practiceEntries);

  if (!loaded || !scoreData) return null;

  const trendIcon =
    scoreData.trend === 'improving' ? <TrendingUp className="h-3 w-3 text-primary" /> :
    scoreData.trend === 'declining' ? <TrendingDown className="h-3 w-3 text-destructive" /> :
    <Minus className="h-3 w-3 text-muted-foreground" />;

  const trendLabel = t(`holzenScore.${scoreData.trend}`);

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (scoreData.score / 100) * circumference;

  // Compute practice days for context label
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const practiceDays = new Set(
    practiceEntries
      .filter(p => new Date(p.created_at) >= last30)
      .map(p => new Date(p.created_at).toISOString().slice(0, 10))
  ).size;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          {t('holzenScore.title')}
        </p>
        <div className="flex items-center gap-1">
          {trendIcon}
          <span className="text-[10px] font-mono text-muted-foreground">{trendLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.3" />
            <circle
              cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 44 44)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-mono font-medium">{scoreData.score}</span>
          </div>
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <ScoreBar label={t('holzenScore.mood')} value={scoreData.moodScore} />
          <ScoreBar label={t('holzenScore.actions')} value={scoreData.outcomeScore} />
          <ScoreBar label={t('holzenScore.streak')} value={scoreData.streakScore} />
          <ScoreBar
            label={t('holzenScore.practice', 'Practice')}
            value={scoreData.practiceScore}
            detail={t('holzenScore.practiceDays', '{{count}} days this month', { count: practiceDays })}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        {t('holzenScore.basedOn')}
      </p>
    </div>
  );
}

function ScoreBar({ label, value, detail }: { label: string; value: number; detail?: string }) {
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
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
