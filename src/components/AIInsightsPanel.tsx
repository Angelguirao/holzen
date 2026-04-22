import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingUp, Clock, Brain, Sparkles, Target, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { parseEdgeFunctionError } from '@/lib/edge-function-error';

interface Insight {
  category: 'regulation' | 'tolerance' | 'alignment' | 'reappraisal' | 'awareness' | 'timing' | 'mood' | 'behavior' | 'engagement' | 'growth';
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
  language?: string;
}

const PAGE_SIZE = 10;

const LANG_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', pt: 'PT', de: 'DE', nl: 'NL', fr: 'FR', tr: 'TR',
};

const CATEGORY_ICONS: Record<string, typeof TrendingUp> = {
  regulation: Sparkles,
  tolerance: Target,
  alignment: Brain,
  reappraisal: Clock,
  awareness: TrendingUp,
  // Legacy fallbacks
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useHolzen();
  const { subscribed, loading: subLoading } = useSubscription();
  const [allData, setAllData] = useState<InsightsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInsights = useCallback(async () => {
    if (!user) return;
    const { data: rows } = await supabase
      .from('reflection_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(PAGE_SIZE);

    const parsed = (rows as unknown as InsightsRow[]) ?? [];
    setAllData(parsed);
    setHasMore(parsed.length === PAGE_SIZE);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const last = allData[allData.length - 1];
    if (!last) { setLoadingMore(false); return; }
    const { data: rows } = await supabase
      .from('reflection_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .lt('generated_at', last.generated_at)
      .limit(PAGE_SIZE);
    const parsed = (rows as unknown as InsightsRow[]) ?? [];
    setAllData((prev) => [...prev, ...parsed]);
    setHasMore(parsed.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [user, loadingMore, hasMore, allData]);

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore });

  const generateInsights = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('reflection-insights', {
        body: { user_id: user.id, language },
      });
      if (error) {
        const parsed = await parseEdgeFunctionError(error);
        const detail = parsed.message ?? t('aiInsights.failedToGenerate');
        throw new Error(detail);
      }
      await loadInsights();
      toast(t('aiInsights.generated'));
    } catch (e) {
      const message = e instanceof Error ? e.message : t('aiInsights.failedToGenerate');
      toast(message);
    } finally {
      setGenerating(false);
    }
  }, [user, language, loadInsights, t]);

  if (subLoading) {
    return <SubscriptionSkeleton variant="inline" />;
  }

  if (!subscribed) {
    return (
      <div className="py-8 text-center space-y-2">
        <Lock className="h-5 w-5 mx-auto text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">{t('pro.upgradeDesc')}</p>
      </div>
    );
  }

  if (reflectionCount < 5) {
    return (
      <div className="py-8 text-center space-y-2">
        <Brain className="h-5 w-5 mx-auto text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          {t('aiInsights.needMinReflections', { count: reflectionCount })}
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

  const latest = allData[0] ?? null;
  const isStale = latest
    ? Date.now() - new Date(latest.generated_at).getTime() > 7 * 24 * 60 * 60 * 1000
    : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
          {t('aiInsights.title')}
        </p>
        <LoadingButton
          variant="ghost"
          size="sm"
          onClick={generateInsights}
          loading={generating}
          loadingText={t('aiInsights.analyzing')}
          className="text-[10px] font-mono text-muted-foreground gap-1.5 h-7"
        >
          <RefreshCw className="h-3 w-3" />
          {latest ? t('aiInsights.refresh') : t('aiInsights.generate')}
        </LoadingButton>
      </div>

      {allData.length === 0 && !generating && (
        <div className="py-6 text-center space-y-3">
          <Brain className="h-5 w-5 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {t('aiInsights.noInsightsYet')}
          </p>
        </div>
      )}

      {generating && allData.length === 0 && (
        <div className="py-6 text-center space-y-3">
          <Loader2 className="h-5 w-5 mx-auto text-muted-foreground animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">
            {t('aiInsights.analyzingCount', { count: reflectionCount })}
          </p>
        </div>
      )}

      {allData.map((row, rowIdx) => (
        <div key={row.id} className="space-y-2.5">
          <div className="flex items-center justify-between pt-1">
            <p className="text-[9px] font-mono text-muted-foreground/50">
              {format(new Date(row.generated_at), 'MMM d, yyyy · h:mm a')}
              {rowIdx === 0 && isStale && (
                <span className="ml-2 text-primary/50">{t('aiInsights.refreshRecommended')}</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {row.language && row.language !== language && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/60 uppercase">
                  {LANG_LABELS[row.language] || row.language}
                </span>
              )}
              <p className="text-[9px] font-mono text-muted-foreground/30">
                {t('aiInsights.reflectionsCount', { count: row.reflection_count })}
              </p>
            </div>
          </div>

          {row.insights.map((insight, i) => {
            const Icon = CATEGORY_ICONS[insight.category] || Brain;
            const style = SENTIMENT_STYLES[insight.sentiment] || SENTIMENT_STYLES.neutral;

            return (
              <div
                key={`${row.id}-${i}`}
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
      ))}

      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center">{t('common.loadingMore')}</p>
      )}
    </div>
  );
}
