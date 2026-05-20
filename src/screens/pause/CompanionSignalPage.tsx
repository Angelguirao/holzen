import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/app/components/HolzenProvider';
import {
  useCompanionFullViewPage,
  useSignalSourceTrustedHost,
} from '@/features/pause/public-hooks';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { SignalFullView } from '@/screens/pause/components/companion/SignalFullView';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/screens/pause/components/companion/InterventionCrossRefBadge';
import { PageMeta } from '@/app/components/PageMeta';

/**
 * Full-screen Signal chapter — dedicated route opened via the "Open full view"
 * button in `CompanionSection`.
 */
export default function CompanionSignalPage() {
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
      signal,
      signalLoading,
      signalError,
      retrySignal,
      cacheIds,
      cacheRelaxations,
      regenerateCompanion,
      intervention,
    },
  } = useCompanionFullViewPage({
    routeInstanceId: rid,
    slot: 'signal',
    companionPrefs,
    severity,
  });

  const { host, isTrusted } = useSignalSourceTrustedHost(signal?.url);

  if (missingRouteId) return <Navigate to="/" replace />;

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
          host={host}
          isTrusted={isTrusted}
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
