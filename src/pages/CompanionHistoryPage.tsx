import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useCompanionData } from '@/hooks/use-companion-data';
import {
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  viewRowToCompanionData,
  type FetchedReflectionRow,
} from '@/lib/pause-session-storage';
import { HistoricalInsightDisplay } from '@/components/HistoricalInsightDisplay';
import { CompanionFeedback } from '@/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/components/companion/CompanionFocusLayout';
import { ReadTime } from '@/components/companion/ReadTime';
import { WhyThisCard } from '@/components/companion/WhyThisCard';
import { HistoryThread } from '@/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/components/companion/InterventionCrossRefBadge';
import { SaveThisMomentButton } from '@/components/companion/SaveThisMomentButton';
import { useStaggeredReveal } from '@/components/companion/use-staggered-reveal';
import { PageMeta } from '@/components/PageMeta';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
const BREATHING_ROOM_MS = 8000;

type Row = FetchedReflectionRow & { mood?: string | null };

export default function CompanionHistoryPage() {
  const { reflectionId: rid } = useParams<{ reflectionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { companionPrefs, severity } = useHolzen();

  const [row, setRow] = useState<Row | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!rid) return;
    let cancelled = false;
    setRow(null);
    setLoadError(false);
    void (async () => {
      const { data, error } = await supabase
        .from('v_reflection_with_companions')
        .select('id, message, context, mood, haiku, grounding_title, grounding_body')
        .eq('id', rid)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data?.message) {
        setLoadError(true);
        return;
      }
      setRow(data as Row);
    })();
    return () => {
      cancelled = true;
    };
  }, [rid]);

  const reflectionId = row?.id ?? null;
  const reflectionMessage = row?.message ?? '';
  const context = row?.context ?? null;
  const mood = row?.mood ?? null;
  const companions = useMemo(() => (row ? viewRowToCompanionData(row) : DEFAULT_COMPANIONS), [row]);
  const prefs = companionPrefs ?? DEFAULT_PREFS;
  const severityNumber = SEVERITY_NUMBER[severity] ?? 6;

  const {
    historyInsight,
    historyLoading,
    historyError,
    retryHistory,
    fetchCompanion,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    interventionLoading,
    intervention,
  } = useCompanionData({
    companions,
    prefs: { ...prefs, history: true },
    reflectionId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!reflectionId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (historyInsight || historyLoading || historyError) return;
    void fetchCompanion('history');
  }, [
    reflectionId,
    reflectionMessage,
    interventionLoading,
    historyInsight,
    historyLoading,
    historyError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(BREATHING_ROOM_MS);

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'library') navigate('/library');
    else navigate(-1);
  }, [location.state, navigate]);

  if (!rid) return <Navigate to="/" replace />;

  if (loadError) {
    return (
      <CompanionFocusLayout title={t('companions.lookBack')} onBack={handleBack}>
        <PageMeta
          title={t('companions.focusHistoryMeta')}
          description={t('companions.focusHistoryMeta')}
          noindex
        />
        <p className="text-sm text-muted-foreground">{t('companions.focusLoadError')}</p>
      </CompanionFocusLayout>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-busy="true">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
      </div>
    );
  }

  return (
    <CompanionFocusLayout title={t('companions.lookBack')} onBack={handleBack}>
      <PageMeta
        title={t('companions.focusHistoryMeta')}
        description={t('companions.focusHistoryMeta')}
        noindex
      />
      <div className="space-y-6">
        <InterventionCrossRefBadge companion="history" intervention={intervention} />

        {historyInsight && (
          <div className="flex items-center gap-2 flex-wrap">
            <ReadTime
              chars={
                (historyInsight.title?.length ?? 0) +
                (historyInsight.btcInsight?.length ?? 0) +
                (historyInsight.analogy?.length ?? 0)
              }
            />
            <WhyThisCard companion="history" mood={mood} className="ml-auto" />
          </div>
        )}

        <HistoricalInsightDisplay
          data={historyInsight}
          loading={historyLoading}
          error={historyError}
          onRetry={retryHistory}
        />
        {historyInsight && cacheRelaxations.history && (
          <p className="text-[10px] text-muted-foreground/55 font-mono leading-snug" role="status">
            {t(`companions.cacheRelaxation.${cacheRelaxations.history}`)}
          </p>
        )}
        {historyInsight && revealed && (
          <div className="space-y-4 border-t border-border/20 pt-5 animate-in fade-in duration-500">
            <SaveThisMomentButton
              seedTitle={historyInsight.title ?? ''}
              seedContext={historyInsight.btcInsight ?? ''}
              companion="history"
              reflectionId={reflectionId}
            />
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="history_insight"
              cacheId={cacheIds.history}
              regenerateSlot="history"
              onRegenerate={() => regenerateCompanion('history')}
              regenerating={historyLoading}
            />
          </div>
        )}

        <HistoryThread companion="history" currentReflectionId={reflectionId} />
      </div>
    </CompanionFocusLayout>
  );
}
