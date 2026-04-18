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
import { SignalFullView } from '@/components/companion/SignalFullView';
import { HistoryThread } from '@/components/companion/HistoryThread';
import { InterventionCrossRefBadge } from '@/components/companion/InterventionCrossRefBadge';
import { SaveThisMomentButton } from '@/components/companion/SaveThisMomentButton';
import { useStaggeredReveal } from '@/components/companion/use-staggered-reveal';
import { PageMeta } from '@/components/PageMeta';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };
/**
 * Breathing-room delay before feedback + save CTAs fade in. 8 seconds is the
 * same target we picked for the other Full View pages — long enough that users
 * actually read, short enough that it doesn't feel broken.
 */
const BREATHING_ROOM_MS = 8000;

type Row = FetchedReflectionRow & { mood?: string | null };

/**
 * Full-screen Signal chapter — dedicated route opened via the "Open full view"
 * button in `CompanionSection`. Mirrors `CompanionHistoryPage` and adds the
 * shared PR 1 primitives (read-time, "why this card", history thread,
 * breathing-room, cross-reference badge, Pro-gated save-this-moment).
 */
export default function CompanionSignalPage() {
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
    reflectionId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!reflectionId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (signal || signalLoading || signalError) return;
    void fetchCompanion('signal');
  }, [
    reflectionId,
    reflectionMessage,
    interventionLoading,
    signal,
    signalLoading,
    signalError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(BREATHING_ROOM_MS);

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'library') navigate('/library');
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

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-busy="true">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
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
            <SaveThisMomentButton
              seedTitle={signal.title}
              seedContext={signal.body}
              companion="signal"
              reflectionId={reflectionId}
            />
            <CompanionFeedback
              reflectionId={reflectionId}
              companionType="signal"
              cacheId={cacheIds.signal}
              regenerateSlot="signal"
              onRegenerate={() => regenerateCompanion('signal')}
              regenerating={signalLoading}
            />
          </div>
        )}

        <HistoryThread companion="signal" currentReflectionId={reflectionId} />
      </div>
    </CompanionFocusLayout>
  );
}
