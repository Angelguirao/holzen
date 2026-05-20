import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/app/components/HolzenProvider';
import { useCompanionFullViewPage } from '@/features/pause/public-hooks';
import { ZoomOutDisplay } from '@/screens/pause/components/ZoomOutDisplay';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { ReadTime } from '@/screens/pause/components/companion/ReadTime';
import { WhyThisCard } from '@/screens/pause/components/companion/WhyThisCard';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/screens/pause/components/companion/InterventionCrossRefBadge';
import { PageMeta } from '@/app/components/PageMeta';
import { zoomOutTotalCharsForReadTime } from '@/features/pause/public-hooks';

export default function CompanionZoomOutPage() {
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
      zoomOut,
      zoomOutLoading,
      zoomOutError,
      retryZoomOut,
      cacheIds,
      cacheRelaxations,
      regenerateCompanion,
      intervention,
    },
  } = useCompanionFullViewPage({
    routeInstanceId: rid,
    slot: 'zoomOut',
    companionPrefs,
    severity,
  });

  if (missingRouteId) return <Navigate to="/" replace />;

  if (loadError) {
    return (
      <CompanionFocusLayout title={t('companions.zoomOut')} onBack={handleBack}>
        <PageMeta
          title={t('companions.focusZoomOutMeta')}
          description={t('companions.focusZoomOutMeta')}
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
    <CompanionFocusLayout title={t('companions.zoomOut')} onBack={handleBack}>
      <PageMeta
        title={t('companions.focusZoomOutMeta')}
        description={t('companions.focusZoomOutMeta')}
        noindex
      />
      <div className="space-y-6">
        <InterventionCrossRefBadge companion="zoomOut" intervention={intervention} />

        {zoomOut && (
          <div className="flex items-center gap-2 flex-wrap">
            <ReadTime chars={zoomOutTotalCharsForReadTime(zoomOut)} />
            <WhyThisCard companion="zoomOut" mood={mood} className="ml-auto" />
          </div>
        )}

        <ZoomOutDisplay
          data={zoomOut}
          loading={zoomOutLoading}
          error={zoomOutError}
          onRetry={retryZoomOut}
        />
        {zoomOut && cacheRelaxations.zoomOut && (
          <p className="text-[10px] text-muted-foreground/55 font-mono leading-snug" role="status">
            {t(`companions.cacheRelaxation.${cacheRelaxations.zoomOut}`)}
          </p>
        )}
        {zoomOut && revealed && (
          <div className="space-y-4 border-t border-border/20 pt-5 animate-in fade-in duration-500">
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="zoom_out"
              cacheId={cacheIds.zoomOut}
              regenerateSlot="zoomOut"
              onRegenerate={() => regenerateCompanion('zoomOut')}
              regenerating={zoomOutLoading}
            />
          </div>
        )}

        <HistoryThread companion="zoomOut" currentPauseInstanceId={pauseInstanceId} />
      </div>
    </CompanionFocusLayout>
  );
}
