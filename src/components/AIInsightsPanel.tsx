import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RefreshCw, TrendingUp, Clock, Brain, Sparkles, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Insight {
  category: 'timing' | 'mood' | 'behavior' | 'engagement' | 'growth';
  title: string;
  body: string;
  sentiment: 'positive' | 'neutral' | 'actionable';
}

interface InsightsRow {
  id: string;
  insights: Insight[];
  reflection_count: number;
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
}

const CATEGORY_ICONS: Record<string, typeof TrendingUp> = {
  timing: Clock,
  mood: Sparkles,
  behavior: Brain,
  engagement: Target,
  growth: TrendingUp,
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'border-primary/20 bg-primary/5',
  neutral: 'border-border/60 bg-muted/30',
  actionable: 'border-accent/20 bg-accent/5',
};

interface Props {
  reflectionCount: number;
}

export function AIInsightsPanel({ reflectionCount }: Props) {
  const { user } = useAuth();
  const [allData, setAllData] = useState<InsightsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadInsights = useCallback(async () => {
    if (!user) return;
    const { data: rows } = await supabase
      .from('reflection_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(20);

    setAllData((rows as unknown as InsightsRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const generateInsights = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('reflection-insights', {
        body: { user_id: user.id },
      });
      if (error) throw error;
      await loadInsights();
      toast('Insights generated');
    } catch {
      toast('Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  }, [user, loadInsights]);

  if (reflectionCount < 5) {
    return (
      <div className="py-8 text-center space-y-2">
        <Brain className="h-5 w-5 mx-auto text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          Need at least 5 reflections to generate insights. You have {reflectionCount}.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 w-full rounded-md bg-muted/30 animate-pulse" />
        <div className="h-20 w-full rounded-md bg-muted/30 animate-pulse" />
      </div>
    );
  }

  const insights = data?.insights ?? [];
  const isStale = data
    ? Date.now() - new Date(data.generated_at).getTime() > 7 * 24 * 60 * 60 * 1000
    : true;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          AI Pattern Analysis
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateInsights}
          disabled={generating}
          className="text-[10px] font-mono text-muted-foreground gap-1.5 h-7"
        >
          {generating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {generating ? 'Analyzing…' : data ? 'Refresh' : 'Generate'}
        </Button>
      </div>

      {/* No insights yet */}
      {insights.length === 0 && !generating && (
        <div className="py-6 text-center space-y-3">
          <Brain className="h-5 w-5 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            No insights generated yet. Click "Generate" to analyze your reflection patterns.
          </p>
        </div>
      )}

      {/* Generating state */}
      {generating && insights.length === 0 && (
        <div className="py-6 text-center space-y-3">
          <Loader2 className="h-5 w-5 mx-auto text-muted-foreground animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">
            Analyzing {reflectionCount} reflections…
          </p>
        </div>
      )}

      {/* Insight cards */}
      {insights.length > 0 && (
        <>
          <div className="space-y-2.5">
            {insights.map((insight, i) => {
              const Icon = CATEGORY_ICONS[insight.category] || Brain;
              const style = SENTIMENT_STYLES[insight.sentiment] || SENTIMENT_STYLES.neutral;

              return (
                <div
                  key={i}
                  className={`rounded-md border px-4 py-3 space-y-1.5 ${style}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs font-mono font-medium text-foreground/80">
                      {insight.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                    {insight.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/40 pt-1">
            <span>
              Based on {data?.reflection_count} reflections
              {data?.period_start && data?.period_end && (
                <> · {format(new Date(data.period_start), 'MMM d')} – {format(new Date(data.period_end), 'MMM d, yyyy')}</>
              )}
            </span>
            {isStale && (
              <span className="text-primary/50">Refresh recommended</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
