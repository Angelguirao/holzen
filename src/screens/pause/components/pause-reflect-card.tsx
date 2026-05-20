import { useTranslation } from 'react-i18next';
import { usePauseArtifactHaiku } from '@/features/pause/public-hooks';
import { PauseReflectFavoriteButton } from '@/screens/pause/components/pause-reflect-favorite-button';
import { PauseReflectMessageBody } from '@/screens/pause/components/pause-reflect-message-body';
import { PauseReflectPostItSection } from '@/screens/pause/components/pause-reflect-post-it-section';

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
  const { artifactHaiku } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled,
    trigger: 'immediate',
  });

  return (
    <section aria-labelledby="pause-reflect-card-label">
      <h2 id="pause-reflect-card-label" className="sr-only">
        {t('pause.reflect.cardAria', { defaultValue: 'Reflection' })}
      </h2>
      <div className="rounded-2xl border-2 border-primary bg-card/40 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <PauseReflectMessageBody
            context={context}
            reflectionMessage={reflectionMessage}
            reflectionLoading={reflectionLoading}
            reflectionError={reflectionError}
            onReflectionRetry={onReflectionRetry}
            artifactHaiku={artifactHaiku}
          />
          {subscribed ? (
            <PauseReflectFavoriteButton isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
          ) : null}
        </div>

        {pauseInstanceId && subscribed ? <PauseReflectPostItSection pauseInstanceId={pauseInstanceId} /> : null}

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
