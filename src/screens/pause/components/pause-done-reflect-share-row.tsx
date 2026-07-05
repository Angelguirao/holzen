import { useTranslation } from 'react-i18next';
import { Image } from 'lucide-react';
import { usePauseReflectUiTelemetry } from '@/features/pause/public-ritual-reflect';
import { useReflectionShareHandlers } from '@/features/pause/public-ritual-reflect';
import { Button } from '@/components/ui/button';
import { ShareReflection } from '@/screens/pause/components/ShareReflection';

export type PauseDoneReflectShareRowProps = {
  subscribed: boolean;
  reflectionMessage?: string | null;
  context?: string | null;
  haiku?: string | null;
  wallpaperMood: string | null;
  pauseInstanceId?: string | null;
};

const DONE_SHARE_PILL_CLASS =
  'h-9 min-w-[7.5rem] rounded-full border-primary/40 bg-primary/5 px-4 text-sm font-normal text-primary hover:bg-primary/10 gap-1.5';

/** Figma Done share row — inline Share + Generate wallpaper pills when reflection exists. */
export function PauseDoneReflectShareRow({
  subscribed,
  reflectionMessage,
  context,
  haiku,
  wallpaperMood,
  pauseInstanceId,
}: PauseDoneReflectShareRowProps) {
  "use memo";
  const { t } = useTranslation();
  const msg = (reflectionMessage ?? '').trim();
  const { onShareMenuOpen, onWallpaperTap } = usePauseReflectUiTelemetry(pauseInstanceId, 'pause_done');
  const shareHandlers = useReflectionShareHandlers({ message: msg, context, haiku, wallpaperMood, t });

  if (!subscribed || !msg) return null;

  return (
    <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-3 pt-2">
      <ShareReflection
        {...shareHandlers}
        onMenuOpen={onShareMenuOpen}
        triggerClassName={DONE_SHARE_PILL_CLASS}
        triggerLabel={t('pause.reflect.shareCta')}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={DONE_SHARE_PILL_CLASS}
        onClick={() => {
          onWallpaperTap();
          void shareHandlers.shareImage();
        }}
      >
        <Image className="h-3.5 w-3.5" aria-hidden />
        {t('pause.done.generateWallpaper')}
      </Button>
    </div>
  );
}
