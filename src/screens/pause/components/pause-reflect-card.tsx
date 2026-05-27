import { useTranslation } from 'react-i18next';
import { usePauseArtifactHaiku } from '@/features/pause/public-ritual-reflect';
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
  companionHaikuEnabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
};

/** Reflection letter card + optional Pro note/tags below. */
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
  companionHaikuEnabled,
  isFavorite,
  onToggleFavorite,
  subscribed,
}: PauseReflectCardProps) {
  "use memo";
  const { t } = useTranslation();
  const { artifactHaiku } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled,
    trigger: 'immediate',
  });

  return (
    <div className="w-full space-y-6">
      <section aria-labelledby="pause-reflect-card-label">
        <h2 id="pause-reflect-card-label" className="sr-only">
          {t('pause.reflect.letterAria', { defaultValue: 'Your reflection' })}
        </h2>
        <div className="rounded-2xl border-2 border-primary bg-card/40 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-3">
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
              artifactHaiku={artifactHaiku}
            />
            {subscribed ? (
              <PauseReflectFavoriteButton isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
            ) : null}
          </div>
        </div>
      </section>

      {pauseInstanceId && subscribed ? (
        <section aria-labelledby="pause-reflect-note-label" className="space-y-3">
          <h3
            id="pause-reflect-note-label"
            className="text-center text-xs font-mono uppercase tracking-wide text-muted-foreground"
          >
            {t('pause.reflect.yourNoteSection', { defaultValue: 'Your note (optional)' })}
          </h3>
          <PauseReflectPostItSection pauseInstanceId={pauseInstanceId} />
        </section>
      ) : null}

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
