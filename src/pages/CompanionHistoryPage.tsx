import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import { useCompanionData } from '@/hooks/use-companion-data';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/lib/pause-session-storage';
import { usePauseSessionCompanionSnapshot } from '@/hooks/use-pause-session-companion-snapshot';
import { HistoricalInsightDisplay } from '@/components/HistoricalInsightDisplay';
import { CompanionFeedback } from '@/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/components/companion/CompanionFocusLayout';
import { ReadTime } from '@/components/companion/ReadTime';
import { WhyThisCard } from '@/components/companion/WhyThisCard';
import { HistoryThread } from '@/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/components/companion/InterventionCrossRefBadge';
import { useStaggeredReveal } from '@/components/companion/use-staggered-reveal';
import { useFullviewTelemetry } from '@/hooks/use-fullview-telemetry';
import { PageMeta } from '@/components/PageMeta';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
const BREATHING_ROOM_MS = 8000;


export default function CompanionHistoryPage() {
  const { pauseInstanceId: rid } = useParams<{ pauseInstanceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { companionPrefs, severity } = useHolzen();

  const { snapshot, isPending: snapshotPending, loadError } = usePauseSessionCompanionSnapshot(rid);

  const pauseInstanceId = snapshot?.id ?? null;
  const reflectionMessage = snapshot?.reflectionMessage ?? '';
  const context = snapshot?.context ?? null;
  const mood = snapshot?.mood ?? null;
  const companions = snapshot?.companions ?? DEFAULT_COMPANIONS;
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
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!pauseInstanceId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (historyInsight || historyLoading || historyError) return;
    void fetchCompanion('history');
  }, [
    pauseInstanceId,
    reflectionMessage,
    interventionLoading,
    historyInsight,
    historyLoading,
    historyError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(BREATHING_ROOM_MS);
  useFullviewTelemetry('history', pauseInstanceId);

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'archive') navigate('/archive');
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

  if (!loadError && (snapshotPending || !snapshot)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border/50 border-t-nox-text-link/70" />
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
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="history_insight"
              cacheId={cacheIds.history}
              regenerateSlot="history"
              onRegenerate={() => regenerateCompanion('history')}
              regenerating={historyLoading}
            />
          </div>
        )}

        <HistoryThread companion="history" currentPauseInstanceId={pauseInstanceId} />
      </div>
    </CompanionFocusLayout>
  );
}
