import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/app/components/HolzenProvider';
import { useCompanionFullViewPage } from '@/features/pause/public-hooks';
import { HistoricalInsightDisplay } from '@/screens/pause/components/HistoricalInsightDisplay';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { ReadTime } from '@/screens/pause/components/companion/ReadTime';
import { WhyThisCard } from '@/screens/pause/components/companion/WhyThisCard';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/screens/pause/components/companion/InterventionCrossRefBadge';
import { PageMeta } from '@/app/components/PageMeta';

export default function CompanionHistoryPage() {
  const { pauseInstanceId: rid } = useParams<{ pauseInstanceId: string }>();
  const { t } = useTranslation();
  const { companionPrefs, severity } = useHolzen();

  const {
    missingRouteId,
    loadError,
    snapshotPending,
    snapshot,
    pauseInstanceId,
    mood,
    revealed,
    handleBack,
    companion: {
      historyInsight,
      historyLoading,
      historyError,
      retryHistory,
      cacheIds,
      cacheRelaxations,
      regenerateCompanion,
      intervention,
    },
  } = useCompanionFullViewPage({
    routeInstanceId: rid,
    slot: 'history',
    companionPrefs,
    severity,
  });

  if (missingRouteId) return <Navigate to="/" replace />;

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
