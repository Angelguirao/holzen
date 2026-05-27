import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import {
  resolvePauseReflectMessageView,
  reflectionContentFromLegacyMessage,
} from '@/features/pause/public-ritual-reflect';
import type { CurrentFeelForReflect, ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import {
  trackPauseReflectBlockViewed,
  trackPauseReflectInquiryDisplayed,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import { PauseReflectBlocks } from '@/screens/pause/components/pause-reflect-blocks';

export type PauseReflectMessageBodyProps = {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionContent: ReflectionContentV2 | null;
  currentFeel?: CurrentFeelForReflect;
  reflectionLoading: boolean;
  reflectionError: string | null;
  onReflectionRetry?: () => void;
  artifactHaiku: string | null | undefined;
};

/** Reflection card main copy: structured blocks, error/loading, optional haiku. */
export function PauseReflectMessageBody({
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionContent,
  currentFeel,
  reflectionLoading,
  reflectionError,
  onReflectionRetry,
  artifactHaiku,
}: PauseReflectMessageBodyProps) {
  "use memo";
  const { t } = useTranslation();
  const view = resolvePauseReflectMessageView({
    reflectionError,
    reflectionLoading,
    reflectionMessage,
    reflectionContent,
  });
  const trackedRef = useRef(false);

  const displayContent =
    reflectionContent ??
    (reflectionMessage.trim() ? reflectionContentFromLegacyMessage(reflectionMessage) : null);

  useEffect(() => {
    if (trackedRef.current || view !== 'body' || !displayContent) return;
    trackedRef.current = true;
    trackPauseReflectBlockViewed(pauseInstanceId, {
      schema_version: displayContent.schemaVersion,
    });
    if (displayContent.inquiry.trim()) {
      trackPauseReflectInquiryDisplayed(pauseInstanceId, { mood: currentFeel?.mood });
    }
  }, [view, displayContent, pauseInstanceId, currentFeel?.mood]);

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {view === 'error' ? (
        <HomePauseBlockingErrorPanel error={reflectionError!} onTryAgain={() => onReflectionRetry?.()} />
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
      {view === 'body' && displayContent ? (
        <PauseReflectBlocks
          pauseInstanceId={pauseInstanceId}
          context={context}
          content={displayContent}
          currentFeel={currentFeel}
        />
      ) : null}
      {artifactHaiku?.trim() ? (
        <p className="pt-1 text-sm italic leading-relaxed text-muted-foreground">{artifactHaiku.trim()}</p>
      ) : null}
    </div>
  );
}
