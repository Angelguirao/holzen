import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePauseHomeContext } from '@/features/pause/public-home';
import { useProfile } from '@/features/user/public-hooks';
import { useCompanionFullViewPage } from '@/features/pause/public-ritual-frame';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { GroundingFullView } from '@/screens/pause/components/companion/GroundingFullView';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { RelatedBiasesThisMonth } from '@/screens/pause/components/companion/RelatedBiasesThisMonth';
import { PageMeta } from '@/app/components/PageMeta';

/** Full-screen Grounding chapter — mirrors History / Signal full-view routes. */
export default function CompanionGroundingPage() {
  const { pauseInstanceId: rid } = useParams<{ pauseInstanceId: string }>();
  const { t } = useTranslation();
  const { severity } = usePauseHomeContext();
  const { companionPrefs } = useProfile();

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
      grounding,
      groundingLoading,
      groundingError,
      retryGrounding,
      cacheIds,
      cacheRelaxations,
      regenerateCompanion,
    },
  } = useCompanionFullViewPage({
    routeInstanceId: rid,
    slot: 'grounding',
    companionPrefs,
    severity,
  });

  if (missingRouteId) return <Navigate to="/" replace />;

  if (loadError) {
    return (
      <CompanionFocusLayout title={t('companions.groundTitle')} onBack={handleBack}>
        <PageMeta
          title={t('companions.fullview.grounding.meta')}
          description={t('companions.fullview.grounding.meta')}
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
    <CompanionFocusLayout title={t('companions.groundTitle')} onBack={handleBack}>
      <PageMeta
        title={t('companions.fullview.grounding.meta')}
        description={t('companions.fullview.grounding.meta')}
        noindex
      />
      <div className="space-y-6">
        <GroundingFullView
          grounding={grounding}
          loading={groundingLoading}
          error={groundingError}
          onRetry={retryGrounding}
          mood={mood}
        />

        {grounding && cacheRelaxations.grounding && (
          <p className="text-[10px] text-muted-foreground/55 font-mono leading-snug" role="status">
            {t(`companions.cacheRelaxation.${cacheRelaxations.grounding}`)}
          </p>
        )}

        {grounding && revealed && (
          <div className="space-y-4 border-t border-border/20 pt-5 animate-in fade-in duration-500">
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="grounding"
              cacheId={cacheIds.grounding}
              regenerateSlot="grounding"
              onRegenerate={() => regenerateCompanion('grounding')}
              regenerating={groundingLoading}
            />
          </div>
        )}

        <RelatedBiasesThisMonth
          currentPauseInstanceId={pauseInstanceId}
          currentTitle={grounding?.title ?? null}
        />

        <HistoryThread companion="grounding" currentPauseInstanceId={pauseInstanceId} />
      </div>
    </CompanionFocusLayout>
  );
}
