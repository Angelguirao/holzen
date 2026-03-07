import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzenScore } from '@/hooks/use-holzen-score';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function HolzenScoreCard() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<{ created_at: string; mood: string | null; outcome: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reflections')
      .select('created_at, mood, outcome')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setReflections(data ?? []);
        setLoaded(true);
      });
  }, [user]);

  const scoreData = useHolzenScore(reflections);

  if (!loaded || !scoreData) return null;

  const trendIcon =
    scoreData.trend === 'improving' ? <TrendingUp className="h-3 w-3 text-primary" /> :
    scoreData.trend === 'declining' ? <TrendingDown className="h-3 w-3 text-destructive" /> :
    <Minus className="h-3 w-3 text-muted-foreground" />;

  const trendLabel =
    scoreData.trend === 'improving' ? 'Improving' :
    scoreData.trend === 'declining' ? 'Declining' : 'Stable';

  // Ring progress
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (scoreData.score / 100) * circumference;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          Holzen Score
        </p>
        <div className="flex items-center gap-1">
          {trendIcon}
          <span className="text-[10px] font-mono text-muted-foreground">{trendLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="4"
              opacity="0.3"
            />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 44 44)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-mono font-medium">{scoreData.score}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 flex-1 min-w-0">
          <ScoreBar label="Mood" value={scoreData.moodScore} />
          <ScoreBar label="Actions" value={scoreData.outcomeScore} />
          <ScoreBar label="Streak" value={scoreData.streakScore} />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        Based on your last 30 reflections. Higher is calmer.
      </p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
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
