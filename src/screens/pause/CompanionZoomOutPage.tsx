import { useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useCompanionData } from '@/features/pause/public-hooks';
import { usePauseSessionCompanionSnapshot } from '@/screens/pause/hooks/use-pause-session-companion-snapshot';
import { ZoomOutDisplay } from '@/screens/pause/components/ZoomOutDisplay';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { ReadTime } from '@/screens/pause/components/companion/ReadTime';
import { WhyThisCard } from '@/screens/pause/components/companion/WhyThisCard';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/screens/pause/components/companion/InterventionCrossRefBadge';
import { useStaggeredReveal } from '@/screens/pause/components/companion/use-staggered-reveal';
import { useFullviewTelemetry } from '@/screens/pause/hooks/use-fullview-telemetry';
import { PageMeta } from '@/app/components/PageMeta';
import { zoomOutTotalCharsForReadTime } from '@/features/pause/public';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/public';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
const BREATHING_ROOM_MS = 8000;


export default function CompanionZoomOutPage() {
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
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    retryZoomOut,
    fetchCompanion,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    interventionLoading,
    intervention,
  } = useCompanionData({
    companions,
    prefs: { ...prefs, zoomOut: true },
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!pauseInstanceId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (zoomOut || zoomOutLoading || zoomOutError) return;
    void fetchCompanion('zoomOut');
  }, [
    pauseInstanceId,
    reflectionMessage,
    interventionLoading,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(BREATHING_ROOM_MS);
  useFullviewTelemetry('zoomOut', pauseInstanceId);

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'archive') navigate('/archive');
    else navigate(-1);
  }, [location.state, navigate]);

  if (!rid) return <Navigate to="/" replace />;

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
