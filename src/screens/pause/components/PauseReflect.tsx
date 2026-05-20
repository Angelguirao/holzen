import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, CirclePlus, Heart, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import { PauseNote } from '@/screens/pause/components/PauseNote';
import { PauseTags } from '@/screens/pause/components/PauseTags';
import { pauseStepLayout } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import {
  usePauseArtifactHaiku,
  usePauseReflectionStepLog,
  usePauseReflectUiTelemetry,
} from '@/features/pause/public-hooks';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Props {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionLoading?: boolean;
  reflectionError?: string | null;
  onReflectionRetry?: () => void;
  /** When false, skip loading / showing the haiku line (profile companion toggle). */
  companionHaikuEnabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseReflect({
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionLoading = false,
  reflectionError = null,
  onReflectionRetry,
  companionHaikuEnabled,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onContinue,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [postItOpen, setPostItOpen] = useState(false);
  const { artifactHaiku } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled,
    trigger: 'immediate',
  });

  usePauseReflectionStepLog({
    pauseInstanceId,
    reflectionLoading,
    reflectionMessage,
    reflectionError,
  });

  const { onPostItOpen } = usePauseReflectUiTelemetry(pauseInstanceId, 'pause_reflect');

  const openPostIt = useCallback(() => {
    hapticFeedback('light');
    setPostItOpen(true);
    onPostItOpen();
  }, [onPostItOpen]);

  return (
    <motion.div
      className={`${pauseStepLayout.columnFlow} scroll-mt-36 gap-8 pt-6 sm:scroll-mt-40 sm:pt-10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-2 text-center">
        <p className={pauseStepLayout.screenTitle}>
          {t('pause.reflect.title', { defaultValue: 'Reflect' })}
        </p>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.reflect.subtitle', { defaultValue: 'Take your time' })}
        </p>
      </div>

      <section aria-labelledby="pause-reflect-card-label">
        <h2 id="pause-reflect-card-label" className="sr-only">
          {t('pause.reflect.cardAria', { defaultValue: 'Reflection' })}
        </h2>
        <div className="rounded-2xl border-2 border-primary bg-card/40 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {context?.trim() ? (
                <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{context.trim()}</p>
              ) : null}
              {reflectionError ? (
                <HomePauseBlockingErrorPanel
                  error={reflectionError}
                  onTryAgain={() => onReflectionRetry?.()}
                />
              ) : reflectionLoading && !reflectionMessage.trim() ? (
                <div className="space-y-2" aria-busy="true">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    <p className="text-xs font-mono">
                      {t('pause.reflect.generating', { defaultValue: 'Generating reflection…' })}
                    </p>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <p className="font-editorial text-base leading-relaxed text-foreground sm:text-lg">
                  {reflectionMessage}
                </p>
              )}
              {artifactHaiku?.trim() ? (
                <p className="pt-1 text-sm italic leading-relaxed text-muted-foreground">{artifactHaiku.trim()}</p>
              ) : null}
            </div>
            {subscribed ? (
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  onToggleFavorite();
                }}
                className={cn(
                  'shrink-0 rounded-full p-2 transition-colors',
                  isFavorite ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive',
                )}
                aria-label={t('pause.reflect.favoriteAria', { defaultValue: 'Favorite this reflection' })}
              >
                <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} aria-hidden />
              </button>
            ) : null}
          </div>

          {pauseInstanceId && subscribed ? (
            <div className="mt-5 space-y-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full rounded-full border border-primary/30 bg-primary/10 font-medium text-primary shadow-none hover:bg-primary/15 sm:w-auto"
                onClick={openPostIt}
              >
                <CirclePlus className="mr-2 h-4 w-4" aria-hidden />
                {t('pause.reflect.addPostIt', { defaultValue: 'Add your post-it' })}
              </Button>
              {postItOpen ? (
                <motion.div
                  className="space-y-4 border-t border-border/30 pt-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <PauseNote pauseInstanceId={pauseInstanceId} />
                  <PauseTags pauseInstanceId={pauseInstanceId} />
                </motion.div>
              ) : null}
            </div>
          ) : null}

          {pauseInstanceId && !subscribed ? (
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              {t('pause.reflect.freeHint', {
                defaultValue:
                  'Holzen Pro adds an optional private note and tags on each pause — useful when you look back in your Library.',
              })}
            </p>
          ) : null}
        </div>
      </section>

      <motion.div
        className="flex flex-col items-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
      >
        <Button
          type="button"
          variant="outline"
          className={pauseStepLayout.ritualPrimaryOutlineCta}
          onClick={onContinue}
          disabled={reflectionLoading || Boolean(reflectionError) || !reflectionMessage.trim()}
        >
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </motion.div>

      {onBack ? (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
