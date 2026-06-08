import { useTranslation } from 'react-i18next';
import type { CurrentFeelForReflect, ReflectionContentV2 } from '@/features/pause/public-ritual-reflect';
import { PauseReflectFavoriteButton } from '@/screens/pause/components/pause-reflect-favorite-button';
import { PauseReflectMessageBody } from '@/screens/pause/components/pause-reflect-message-body';
import { PauseReflectPostItSection } from '@/screens/pause/components/pause-reflect-post-it-section';

export type PauseReflectCardProps = {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionContent: ReflectionContentV2 | null;
  currentFeel?: CurrentFeelForReflect;
  severityAbsPct?: number;
  reflectionLoading: boolean;
  reflectionError: string | null;
  onReflectionRetry?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
};

/** Reflection letter card; Pro post-it note lives inside the card (Wireframes 353:6201). */
export function PauseReflectCard({
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionContent,
  currentFeel,
  severityAbsPct,
  reflectionLoading,
  reflectionError,
  onReflectionRetry,
  isFavorite,
  onToggleFavorite,
  subscribed,
}: PauseReflectCardProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-6">
      <section aria-labelledby="pause-reflect-card-label">
        <h2 id="pause-reflect-card-label" className="sr-only">
          {t('pause.reflect.letterAria', { defaultValue: 'Your reflection' })}
        </h2>
        <div className="flex flex-col gap-6 rounded-2xl border-2 border-primary bg-card/40 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <PauseReflectMessageBody
              pauseInstanceId={pauseInstanceId}
              context={context}
              reflectionMessage={reflectionMessage}
              reflectionContent={reflectionContent}
              currentFeel={currentFeel}
              severityAbsPct={severityAbsPct}
              reflectionLoading={reflectionLoading}
              reflectionError={reflectionError}
              onReflectionRetry={onReflectionRetry}
            />
            {subscribed ? (
              <PauseReflectFavoriteButton isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
            ) : null}
          </div>
          {pauseInstanceId && subscribed ? (
            <PauseReflectPostItSection pauseInstanceId={pauseInstanceId} />
          ) : null}
        </div>
      </section>

      {pauseInstanceId && !subscribed ? (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t('pause.reflect.freeHint', {
            defaultValue:
              'Holzen Pro adds an optional private note and tags on each pause — useful when you look back in your Library.',
          })}
        </p>
      ) : null}
    </div>
  );
}
