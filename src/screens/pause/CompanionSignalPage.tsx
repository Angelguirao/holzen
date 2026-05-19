import { useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useCompanionData } from '@/screens/pause/hooks/use-companion-data';
import { usePauseSessionCompanionSnapshot } from '@/screens/pause/hooks/use-pause-session-companion-snapshot';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { SignalFullView } from '@/screens/pause/components/companion/SignalFullView';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/screens/pause/components/companion/InterventionCrossRefBadge';
import { useStaggeredReveal } from '@/screens/pause/components/companion/use-staggered-reveal';
import { useFullviewTelemetry } from '@/hooks/use-fullview-telemetry';
import { PageMeta } from '@/app/components/PageMeta';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/public';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
/**
 * Breathing-room delay before feedback + save CTAs fade in. 8 seconds is the
 * same target we picked for the other Full View pages — long enough that users
 * actually read, short enough that it doesn't feel broken.
 */
const BREATHING_ROOM_MS = 8000;


/**
 * Full-screen Signal chapter — dedicated route opened via the "Open full view"
 * button in `CompanionSection`. Mirrors `CompanionHistoryPage` and adds the
 * shared PR 1 primitives (read-time, "why this card", history thread,
 * breathing-room, cross-reference badge, Pro-gated save-this-moment).
 */
export default function CompanionSignalPage() {
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
    signal,
    signalLoading,
    signalError,
    retrySignal,
    fetchCompanion,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    interventionLoading,
    intervention,
  } = useCompanionData({
    companions,
    prefs: { ...prefs, signal: true },
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!pauseInstanceId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (signal || signalLoading || signalError) return;
    void fetchCompanion('signal');
  }, [
    pauseInstanceId,
    reflectionMessage,
    interventionLoading,
    signal,
    signalLoading,
    signalError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(BREATHING_ROOM_MS);
  useFullviewTelemetry('signal', pauseInstanceId);

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'archive') navigate('/archive');
    else navigate(-1);
  }, [location.state, navigate]);

  if (!rid) return <Navigate to="/" replace />;

  if (loadError) {
    return (
      <CompanionFocusLayout title={t('companions.signal')} onBack={handleBack}>
        <PageMeta
          title={t('companions.fullview.signal.meta')}
          description={t('companions.fullview.signal.meta')}
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
    <CompanionFocusLayout title={t('companions.signal')} onBack={handleBack}>
      <PageMeta
        title={t('companions.fullview.signal.meta')}
        description={t('companions.fullview.signal.meta')}
        noindex
      />
      <div className="space-y-6">
        <InterventionCrossRefBadge companion="signal" intervention={intervention} />

        <SignalFullView
          signal={signal}
          loading={signalLoading}
          error={signalError}
          onRetry={retrySignal}
          mood={mood}
        />

        {signal && cacheRelaxations.signal && (
          <p className="text-[10px] text-muted-foreground/55 font-mono leading-snug" role="status">
            {t(`companions.cacheRelaxation.${cacheRelaxations.signal}`)}
          </p>
        )}

        {signal && revealed && (
          <div className="space-y-4 border-t border-border/20 pt-5 animate-in fade-in duration-500">
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="signal"
              cacheId={cacheIds.signal}
              regenerateSlot="signal"
              onRegenerate={() => regenerateCompanion('signal')}
              regenerating={signalLoading}
            />
          </div>
        )}

        <HistoryThread companion="signal" currentPauseInstanceId={pauseInstanceId} />
      </div>
    </CompanionFocusLayout>
  );
}
