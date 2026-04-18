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
import { CompanionFeedback } from '@/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/components/companion/CompanionFocusLayout';
import { GroundingFullView } from '@/components/companion/GroundingFullView';
import { GroundingEnrichment } from '@/components/companion/GroundingEnrichment';
import { HistoryThread } from '@/components/companion/HistoryThread';
import { RelatedBiasesThisMonth } from '@/components/companion/RelatedBiasesThisMonth';
import { useGroundingEnrichment } from '@/hooks/use-grounding-enrichment';
import { useFullviewTelemetry } from '@/hooks/use-fullview-telemetry';
import { InterventionCrossRefBadge } from '@/components/companion/InterventionCrossRefBadge';
import { SaveThisMomentButton } from '@/components/companion/SaveThisMomentButton';
import { useStaggeredReveal } from '@/components/companion/use-staggered-reveal';
import { PageMeta } from '@/components/PageMeta';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
const BREATHING_ROOM_MS = 8000;

type Row = FetchedReflectionRow & { mood?: string | null };

/**
 * Full-screen Grounding chapter. Mirrors `CompanionHistoryPage` / `SignalPage`.
 * Leaves `enrichmentSlot` wire-through as `undefined` in PR 1 — PR 2 plugs in
 * the `grounding-enrich` edge-function output here via `use-grounding-enrichment`.
 */
export default function CompanionGroundingPage() {
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
    nudge,
    nudgeLoading,
    nudgeError,
    retryNudge,
    fetchCompanion,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    interventionLoading,
    intervention,
  } = useCompanionData({
    companions,
    prefs: { ...prefs, grounding: true },
    reflectionId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!reflectionId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (nudge || nudgeLoading || nudgeError) return;
    void fetchCompanion('grounding');
  }, [
    reflectionId,
    reflectionMessage,
    interventionLoading,
    nudge,
    nudgeLoading,
    nudgeError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(BREATHING_ROOM_MS);
  useFullviewTelemetry('grounding', reflectionId);

  const enrichmentQuery = useGroundingEnrichment({
    citation: nudge?.citation ?? null,
    url: nudge?.url ?? null,
  });

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'library') navigate('/library');
    else navigate(-1);
  }, [location.state, navigate]);

  if (!rid) return <Navigate to="/" replace />;

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

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-busy="true">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
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
            <SaveThisMomentButton
              seedTitle={nudge.title}
              seedContext={nudge.body}
              companion="grounding"
              reflectionId={reflectionId}
            />
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="grounding"
              cacheId={cacheIds.nudge}
              regenerateSlot="grounding"
              onRegenerate={() => regenerateCompanion('grounding')}
              regenerating={nudgeLoading}
            />
          </div>
        )}

        <RelatedBiasesThisMonth
          currentReflectionId={reflectionId}
          currentTitle={nudge?.title ?? null}
        />

        <HistoryThread companion="grounding" currentReflectionId={reflectionId} />
      </div>
    </CompanionFocusLayout>
  );
}
