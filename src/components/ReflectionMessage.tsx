import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { ShareReflection } from './ShareReflection';
import { PauseNote } from '@/components/pause/PauseNote';
import { PauseTags } from '@/components/pause/PauseTags';
import { ReflectionWallpaper } from './ReflectionWallpaper';
import { CompanionFeedback } from './CompanionFeedback';
import { CompanionSection, type CompanionData, type CompanionPrefs } from './CompanionSection';
import { useTranslation } from 'react-i18next';

interface Props {
  message: string;
  context: string | null;
  onDismiss: () => void;
  companions?: CompanionData;
  companionPrefs?: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  pauseInstanceId?: string | null;
}

export const ReflectionMessage = forwardRef<HTMLDivElement, Props>(function ReflectionMessage(
  { message, context, onDismiss, companions, companionPrefs, severity, pauseInstanceId },
  ref,
) {
  const { t } = useTranslation();

  return (
    <div ref={ref} className="space-y-6">
      <p className="text-lg leading-relaxed">{message}</p>
      {pauseInstanceId && (
        <CompanionFeedback pauseInstanceId={pauseInstanceId} companionType="reflection" compact />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ShareReflection message={message} context={context} haiku={companions?.haiku} />
          <ReflectionWallpaper message={message} mood={null} context={context} haiku={companions?.haiku} variant="button" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs font-mono text-muted-foreground"
        >
          {t('common.done')}
        </Button>
      </div>

      {pauseInstanceId && <PauseNote pauseInstanceId={pauseInstanceId} />}
      {pauseInstanceId && <PauseTags pauseInstanceId={pauseInstanceId} />}

      {companions && companionPrefs && (
        <CompanionSection
          companions={companions}
          prefs={companionPrefs}
          severity={severity}
          pauseInstanceId={pauseInstanceId}
          context={context}
          reflectionMessage={message}
        />
      )}
    </div>
  );
});
