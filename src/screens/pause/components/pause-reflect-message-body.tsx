import { useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { buildReflectFeelRecapLine } from '@/features/pause/domain/reflect/generation/build-reflect-feel-recap-line';
import { formatReflectDisplayLetter } from '@/features/pause/domain/reflect/generation/format-reflect-display-letter';
import { resolvePauseReflectDisplayContent } from '@/features/pause/domain/reflect/generation/resolve-pause-reflect-display-content';
import type { CurrentFeelForReflect, ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { resolvePauseReflectMessageView } from '@/features/pause/public-ritual-reflect';
import {
  trackPauseReflectBlockViewed,
  trackPauseReflectInquiryDisplayed,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import { PauseReflectInlineNotice } from '@/screens/pause/components/pause-reflect-inline-notice';
import { PauseReflectMarketContext } from '@/screens/pause/components/pause-reflect-market-context';

export type PauseReflectMessageBodyProps = {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionContent: ReflectionContentV2 | null;
  severityAbsPct?: number;
  currentFeel?: CurrentFeelForReflect;
  reflectionLoading: boolean;
  reflectionError: string | null;
  onReflectionRetry?: () => void;
};

/** Reflect card: Feel recap + reflection letter + collapsed market context. */
export function PauseReflectMessageBody({
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionContent,
  severityAbsPct = 0,
  currentFeel,
  reflectionLoading,
  reflectionError,
  onReflectionRetry,
}: PauseReflectMessageBodyProps) {
  "use memo";
  const { t } = useTranslation();

  const displayContent = useMemo(
    () =>
      resolvePauseReflectDisplayContent({
        reflectionContent,
        reflectionMessage,
        reflectionError,
        context,
        severityAbsPct,
        currentFeel,
        t,
      }),
    [reflectionContent, reflectionMessage, reflectionError, context, severityAbsPct, currentFeel, t],
  );

  const feelRecap = useMemo(
    () => buildReflectFeelRecapLine(currentFeel, t),
    [currentFeel, t],
  );

  const letter = useMemo(
    () => (displayContent ? formatReflectDisplayLetter(displayContent) : ''),
    [displayContent],
  );

  const view = resolvePauseReflectMessageView({
    reflectionError: null,
    reflectionLoading,
    reflectionMessage,
    reflectionContent: displayContent,
  });

  const trackedRef = useRef(false);
  const usedClientFallback = Boolean(reflectionError && !reflectionContent && !reflectionMessage.trim());

  useEffect(() => {
    if (trackedRef.current || view !== 'body' || !displayContent) return;
    trackedRef.current = true;
    trackPauseReflectBlockViewed(pauseInstanceId, {
      schema_version: displayContent.schemaVersion,
      has_draft: usedClientFallback,
    });
    if (displayContent.inquiry.trim()) {
      trackPauseReflectInquiryDisplayed(pauseInstanceId, { mood: currentFeel?.mood });
    }
  }, [view, displayContent, pauseInstanceId, currentFeel?.mood, usedClientFallback]);

  const contextStrip = displayContent?.contextStrip?.trim() || null;

  return (
    <div className="min-w-0 flex-1 space-y-4">
      {reflectionError ? (
        <PauseReflectInlineNotice
          message={reflectionError}
          onTryAgain={onReflectionRetry ? () => onReflectionRetry() : undefined}
        />
      ) : null}
      {view === 'loading' ? (
        <div className="space-y-2" aria-busy="true">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            <p className="font-mono text-xs">
              {t('pause.reflect.generating', { defaultValue: 'Generating reflection…' })}
            </p>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : null}
      {view === 'body' && feelRecap ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{feelRecap}</p>
      ) : null}
      {view === 'body' && letter ? (
        <p className="whitespace-pre-line font-editorial text-base leading-relaxed text-foreground sm:text-lg">
          {letter}
        </p>
      ) : null}
      {view === 'body' ? (
        <PauseReflectMarketContext
          pauseInstanceId={pauseInstanceId}
          marketContext={context}
          contextStrip={contextStrip}
        />
      ) : null}
    </div>
  );
}
