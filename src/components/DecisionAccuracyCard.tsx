import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Target } from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';

interface FollowUpRow {
  original_decision: string;
  decision_held: boolean | null;
  created_at: string;
}

export function DecisionAccuracyCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUpRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('follow_ups')
      .select('original_decision, decision_held, created_at')
      .eq('user_id', user.id)
      .not('decision_held', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setFollowUps((data ?? []) as FollowUpRow[]);
        setLoaded(true);
      });
  }, [user]);

  const data = useMemo(() => {
    if (followUps.length < 3) return null;

    const total = followUps.length;
    const held = followUps.filter(f => f.decision_held === true).length;
    const accuracyRate = held / total;

    // Breakdown by decision type
    const byDecision = followUps.reduce((acc, f) => {
      const key = f.original_decision;
      if (!acc[key]) acc[key] = { total: 0, held: 0 };
      acc[key].total++;
      if (f.decision_held) acc[key].held++;
      return acc;
    }, {} as Record<string, { total: number; held: number }>);

    // Recent trend (last 5 vs previous 5)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (followUps.length >= 6) {
      const recentHeld = followUps.slice(0, 3).filter(f => f.decision_held).length / 3;
      const olderHeld = followUps.slice(3, 6).filter(f => f.decision_held).length / 3;
      const diff = recentHeld - olderHeld;
      if (diff > 0.15) trend = 'improving';
      else if (diff < -0.15) trend = 'declining';
    }

    return { total, held, accuracyRate, byDecision, trend };
  }, [followUps]);

  if (!loaded) return null;

  if (!data) {
    return (
      <ChartEmptyState
        title={t('decisionAccuracy.title', 'Decision Accuracy')}
        message={t('decisionAccuracy.emptyMessage', 'After 3 follow-up check-ins, you\'ll see how often your decisions hold over 24 hours.')}
        current={followUps.length}
        needed={3}
      />
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {t('decisionAccuracy.title', 'Decision Accuracy')}
          </p>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${
          data.trend === 'improving' ? 'text-primary' : data.trend === 'declining' ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {t(`decisionAccuracy.${data.trend}`, data.trend)}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono">{Math.round(data.accuracyRate * 100)}%</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {t('decisionAccuracy.heldOf', '{{held}} of {{total}} decisions held', { held: data.held, total: data.total })}
        </span>
      </div>

      {/* Breakdown by decision type */}
      <div className="space-y-1.5">
        {Object.entries(data.byDecision).map(([decision, stats]) => {
          const rate = stats.total > 0 ? Math.round((stats.held / stats.total) * 100) : 0;
          return (
            <div key={decision} className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span className="capitalize">{decision}</span>
                <span>{rate}% <span className="text-muted-foreground/40">({stats.held}/{stats.total})</span></span>
              </div>
              <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/40">
        {t('decisionAccuracy.description', 'Tracks whether your pause decisions held after 24 hours.')}
      </p>
    </div>
  );
}
