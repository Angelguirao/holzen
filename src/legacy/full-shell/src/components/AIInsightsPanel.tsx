import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingUp, Clock, Brain, Sparkles, Target, Loader2, Lock } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionSkeleton } from '@/app/components/SubscriptionSkeleton';
import { parseEdgeFunctionError, toUserFacingAiErrorMessage } from '@/lib/edge-function-error';
import { useProGate } from '@/hooks/use-pro-gate';
import { showLimitReachedToast, isPaidLimitReached } from '@/lib/limit-upsell';

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
  /** Completed pause instances (used for minimum-data gate and progress copy). */
  completedPauseCount: number;
}

const REFLECTION_INSIGHTS_QUERY_KEY = (userId: string) => ['reflection-insights', userId] as const;

async function fetchReflectionInsightsPage(userId: string, offset: number): Promise<InsightsRow[]> {
  const { data: rows, error } = await supabase
    .from('reflection_insights')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;
  return (rows as unknown as InsightsRow[]) ?? [];
}

export function AIInsightsPanel({ completedPauseCount }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { language } = useHolzen();
  const {
    subscribed,
    loading: subLoading,
    applyOptimisticDecrement,
    refresh: refreshSubscription,
    insightsRemaining,
    flexCreditsBalance,
    startCheckout,
  } = useSubscription();
  const { isPro, requirePro } = useProGate();
  const [generating, setGenerating] = useState(false);

  const {
    data: insightPages,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: userId ? REFLECTION_INSIGHTS_QUERY_KEY(userId) : ['reflection-insights', 'none'],
    queryFn: ({ pageParam }) => fetchReflectionInsightsPage(userId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const allData = useMemo(() => insightPages?.pages.flat() ?? [], [insightPages]);
  const loading = Boolean(userId) && isPending;

  const onLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(hasNextPage),
    loading: isFetchingNextPage,
    onLoadMore,
  });

  const generateInsights = useCallback(async () => {
    if (!user) return;
    // Mirror the regenerate paywall: free users see the upgrade toast,
    // Pro users with no insights bucket and no flex credits see the
    // limit-reached toast — never the raw edge function error.
    if (!isPro) {
      requirePro('ai_insights');
      return;
    }
    if (isPaidLimitReached({ remaining: insightsRemaining, flexCreditsBalance })) {
      showLimitReachedToast({ feature: 'insight', startCheckout });
      return;
    }
    setGenerating(true);
    applyOptimisticDecrement('insight');
    try {
      const { data, error } = await invokeEdge('reflection-insights', {
        body: { user_id: user.id, language },
      });
      if (error) {
        const parsed = await parseEdgeFunctionError(error);
        if (parsed.code === 'companions_upgrade_required') {
          requirePro('ai_insights');
          return;
        }
        if (parsed.code === 'companions_quota_exceeded' || parsed.code === 'insights_quota_exceeded') {
          showLimitReachedToast({ feature: 'insight', startCheckout });
          return;
        }
        const detail = toUserFacingAiErrorMessage(parsed, t('aiInsights.failedToGenerate'));
        throw new Error(detail);
      }
      const code = (data as { code?: string } | null)?.code;
      if (code === 'companions_upgrade_required') {
        requirePro('ai_insights');
        return;
      }
      if (code === 'companions_quota_exceeded' || code === 'insights_quota_exceeded') {
        showLimitReachedToast({ feature: 'insight', startCheckout });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: REFLECTION_INSIGHTS_QUERY_KEY(user.id) });
      toast(t('aiInsights.generated'));
    } catch (e) {
      const message = e instanceof Error ? e.message : t('aiInsights.failedToGenerate');
      toast(message);
    } finally {
      setGenerating(false);
      void refreshSubscription();
    }
  }, [
    user,
    language,
    queryClient,
    t,
    applyOptimisticDecrement,
    refreshSubscription,
    isPro,
    requirePro,
    insightsRemaining,
    flexCreditsBalance,
    startCheckout,
  ]);

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

  if (completedPauseCount < 5) {
    return (
      <div className="py-8 text-center space-y-2">
        <Brain className="h-5 w-5 mx-auto text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          {t('aiInsights.needMinReflections', { count: completedPauseCount })}
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
            {t('aiInsights.analyzingCount', { count: completedPauseCount })}
          </p>
        </div>
      )}

      {allData.map((row, rowIdx) => (
        <div key={row.id} className="space-y-2.5">
          <div className="flex items-center justify-between pt-1">
            <p className="text-[9px] font-mono text-muted-foreground/50">
              {format(new Date(row.generated_at), 'MMM d, yyyy · h:mm a')}
              {rowIdx === 0 && isStale && (
                <span className="ml-2 text-muted-foreground">{t('aiInsights.refreshRecommended')}</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {row.language && row.language !== language && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/60 uppercase">
                  {LANG_LABELS[row.language] || row.language}
                </span>
              )}
              <p className="text-[9px] font-mono text-muted-foreground/30">
                {t('aiInsights.pauseSessionsCount', {
                  count: row.reflection_count,
                  defaultValue: '{{count}} pauses',
                })}
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
      {isFetchingNextPage && (
        <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center">{t('common.loadingMore')}</p>
      )}
    </div>
  );
}
