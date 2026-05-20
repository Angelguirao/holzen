import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CirclePlus, Heart, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import { PauseNote } from '@/screens/pause/components/PauseNote';
import { PauseTags } from '@/screens/pause/components/PauseTags';
import { usePauseArtifactHaiku, usePauseReflectUiTelemetry } from '@/features/pause/public-hooks';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type PauseReflectCardProps = {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionLoading: boolean;
  reflectionError: string | null;
  onReflectionRetry?: () => void;
  companionHaikuEnabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
};

/** Reflection message card (loading/error/body, haiku, favorite, optional post-it note/tags). */
export function PauseReflectCard({
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionLoading,
  reflectionError,
  onReflectionRetry,
  companionHaikuEnabled,
  isFavorite,
  onToggleFavorite,
  subscribed,
}: PauseReflectCardProps) {
  const { t } = useTranslation();
  const [postItOpen, setPostItOpen] = useState(false);
  const { artifactHaiku } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled,
    trigger: 'immediate',
  });
  const { onPostItOpen } = usePauseReflectUiTelemetry(pauseInstanceId, 'pause_reflect');

  const openPostIt = useCallback(() => {
    hapticFeedback('light');
    setPostItOpen(true);
    onPostItOpen();
  }, [onPostItOpen]);

  return (
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
                  <p className="font-mono text-xs">
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
                isFavorite ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-destructive',
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
  );
}
