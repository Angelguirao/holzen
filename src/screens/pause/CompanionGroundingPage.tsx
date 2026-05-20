import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/app/components/HolzenProvider';
import { useCompanionFullViewPage, useGroundingEnrichment } from '@/features/pause/public-hooks';
import { CompanionFeedback } from '@/screens/pause/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/screens/pause/components/companion/CompanionFocusLayout';
import { GroundingFullView } from '@/screens/pause/components/companion/GroundingFullView';
import { GroundingEnrichment } from '@/screens/pause/components/companion/GroundingEnrichment';
import { HistoryThread } from '@/screens/pause/components/companion/HistoryThread';
import { RelatedBiasesThisMonth } from '@/screens/pause/components/companion/RelatedBiasesThisMonth';
import { InterventionCrossRefBadge } from '@/screens/pause/components/companion/InterventionCrossRefBadge';
import { PageMeta } from '@/app/components/PageMeta';

/** Full-screen Grounding chapter — mirrors History / Signal full-view routes. */
export default function CompanionGroundingPage() {
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
      nudge,
      nudgeLoading,
      nudgeError,
      retryNudge,
      cacheIds,
      cacheRelaxations,
      regenerateCompanion,
      intervention,
    },
  } = useCompanionFullViewPage({
    routeInstanceId: rid,
    slot: 'grounding',
    companionPrefs,
    severity,
  });

  const enrichmentQuery = useGroundingEnrichment({
    citation: nudge?.citation ?? null,
    url: nudge?.url ?? null,
  });

  if (missingRouteId) return <Navigate to="/" replace />;

  if (loadError) {
    return (
      <CompanionFocusLayout title={t('companions.ground')} onBack={handleBack}>
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
    <CompanionFocusLayout title={t('companions.ground')} onBack={handleBack}>
      <PageMeta
        title={t('companions.fullview.grounding.meta')}
        description={t('companions.fullview.grounding.meta')}
        noindex
      />
      <div className="space-y-6">
        <InterventionCrossRefBadge companion="grounding" intervention={intervention} />

        <GroundingFullView
          nudge={nudge}
          loading={nudgeLoading}
          error={nudgeError}
          onRetry={retryNudge}
          mood={mood}
          enrichmentSlot={
            nudge?.citation ? (
              <GroundingEnrichment
                data={enrichmentQuery.data ?? null}
                loading={enrichmentQuery.isLoading}
                error={enrichmentQuery.isError}
              />
            ) : undefined
          }
        />

        {nudge && cacheRelaxations.nudge && (
          <p className="text-[10px] text-muted-foreground/55 font-mono leading-snug" role="status">
            {t(`companions.cacheRelaxation.${cacheRelaxations.nudge}`)}
          </p>
        )}

        {nudge && revealed && (
          <div className="space-y-4 border-t border-border/20 pt-5 animate-in fade-in duration-500">
            <CompanionFeedback
              pauseInstanceId={pauseInstanceId}
              companionType="grounding"
              cacheId={cacheIds.nudge}
              regenerateSlot="grounding"
              onRegenerate={() => regenerateCompanion('grounding')}
              regenerating={nudgeLoading}
            />
          </div>
        )}

        <RelatedBiasesThisMonth
          currentPauseInstanceId={pauseInstanceId}
          currentTitle={nudge?.title ?? null}
        />

        <HistoryThread companion="grounding" currentPauseInstanceId={pauseInstanceId} />
      </div>
    </CompanionFocusLayout>
  );
}
