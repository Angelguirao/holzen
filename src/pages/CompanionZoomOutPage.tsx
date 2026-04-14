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
import { ZoomOutDisplay } from '@/components/ZoomOutDisplay';
import { CompanionFeedback } from '@/components/CompanionFeedback';
import { CompanionFocusLayout } from '@/components/companion/CompanionFocusLayout';
import { PageMeta } from '@/components/PageMeta';

const SEVERITY_NUMBER: Record<string, number> = { mild: 3, moderate: 6, high: 10 };

type Row = FetchedReflectionRow & { mood?: string | null };

export default function CompanionZoomOutPage() {
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
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    retryZoomOut,
    fetchCompanion,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    interventionLoading,
  } = useCompanionData({
    companions,
    prefs: { ...prefs, zoomOut: true },
    reflectionId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  useEffect(() => {
    if (!reflectionId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (zoomOut || zoomOutLoading || zoomOutError) return;
    void fetchCompanion('zoomOut');
  }, [
    reflectionId,
    reflectionMessage,
    interventionLoading,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    fetchCompanion,
  ]);

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

  if (!row) {
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
        {zoomOut && (
          <CompanionFeedback
            reflectionId={reflectionId}
            companionType="zoom_out"
            cacheId={cacheIds.zoomOut}
            regenerateSlot="zoomOut"
            onRegenerate={() => regenerateCompanion('zoomOut')}
            regenerating={zoomOutLoading}
          />
        )}
      </div>
    </CompanionFocusLayout>
  );
}
