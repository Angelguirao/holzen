import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewData {
  totalReflections: number;
  holdRate: number;
  topMood: string | null;
  recentContext: string | null;
}

export function RitualSelfReview({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: reflections } = await supabase
        .from('reflections')
        .select('mood, outcome, context')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!reflections) { setLoading(false); return; }

      const moodCounts: Record<string, number> = {};
      let held = 0;
      let withOutcome = 0;

      for (const r of reflections) {
        if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
        if (r.outcome) {
          withOutcome++;
          if (r.outcome === 'hold' || r.outcome === 'nothing') held++;
        }
      }

      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      setData({
        totalReflections: reflections.length,
        holdRate: withOutcome > 0 ? Math.round((held / withOutcome) * 100) : 0,
        topMood,
        recentContext: reflections[0]?.context ?? null,
      });
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-3 py-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
        {t('ritual.review.last30Days')}
      </p>

      {data && (
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">{t('ritual.review.reflections')}</span>
            <span>{data.totalReflections}</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">{t('ritual.review.holdRate')}</span>
            <span className={data.holdRate >= 70 ? 'text-primary' : ''}>{data.holdRate}%</span>
          </div>
          {data.topMood && (
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">{t('ritual.review.dominantMood')}</span>
              <span>{t(`moods.${data.topMood}`)}</span>
            </div>
          )}
          {data.recentContext && (
            <p className="text-[10px] font-mono text-muted-foreground/40 leading-relaxed mt-2">
              {t('ritual.review.lastMarket')}: {data.recentContext}
            </p>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => { hapticFeedback('light'); onComplete(); }} className="font-mono text-xs">
        {t('ritual.review.acknowledged')}
      </Button>
    </div>
  );
}
