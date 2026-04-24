import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import { useCompanionData } from '@/hooks/use-companion-data';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/lib/pause-session-storage';
import { loadPauseSessionSnapshot, type PauseSessionSnapshot } from '@/lib/pause-page-loader';
import { ZoomOutDisplay } from '@/components/ZoomOutDisplay';
import { CompanionFeedback } from '@/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/components/companion/CompanionFocusLayout';
import { ReadTime } from '@/components/companion/ReadTime';
import { WhyThisCard } from '@/components/companion/WhyThisCard';
import { HistoryThread } from '@/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/components/companion/InterventionCrossRefBadge';
import { SaveThisMomentButton } from '@/components/companion/SaveThisMomentButton';
import { useStaggeredReveal } from '@/components/companion/use-staggered-reveal';
import { useFullviewTelemetry } from '@/hooks/use-fullview-telemetry';
import { PageMeta } from '@/components/PageMeta';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
const BREATHING_ROOM_MS = 8000;


export default function CompanionZoomOutPage() {
  const { pauseInstanceId: rid } = useParams<{ pauseInstanceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { companionPrefs, severity } = useHolzen();

  const [snapshot, setSnapshot] = useState<PauseSessionSnapshot | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!rid) return;
    let cancelled = false;
    setSnapshot(null);
    setLoadError(false);
    void (async () => {
      const s = await loadPauseSessionSnapshot(rid);
      if (cancelled) return;
      if (!s) {
        setLoadError(true);
        return;
      }
      setSnapshot(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [rid]);

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
    if (st?.from === 'library') navigate('/library');
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

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-busy="true">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
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
            <ReadTime
              chars={
                (zoomOut?.deepTime?.title?.length ?? 0) +
                (zoomOut?.deepTime?.body?.length ?? 0) +
                (zoomOut?.echo?.message?.length ?? 0)
              }
            />
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
            <SaveThisMomentButton
              seedTitle={zoomOut?.deepTime?.title ?? t('companions.zoomOut')}
              seedContext={zoomOut?.deepTime?.body ?? zoomOut?.echo?.message ?? ''}
              companion="zoomOut"
              pauseInstanceId={pauseInstanceId}
            />
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

        <HistoryThread companion="zoomOut" currentReflectionId={pauseInstanceId} />
      </div>
    </CompanionFocusLayout>
  );
}
