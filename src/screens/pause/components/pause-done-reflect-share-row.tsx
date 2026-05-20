import { isPauseMoodValue } from '@/features/pause/public-hooks';
import { usePauseReflectUiTelemetry } from '@/features/pause/public-hooks';
import { ShareReflection } from '@/screens/pause/components/ShareReflection';

export type PauseDoneReflectShareRowProps = {
  subscribed: boolean;
  reflectionMessage?: string | null;
  context?: string | null;
  haiku?: string | null;
  wallpaperMood: string | null;
  pauseInstanceId?: string | null;
};

/** Pro share row on pause done steps when a reflection message exists. */
export function PauseDoneReflectShareRow({
  subscribed,
  reflectionMessage,
  context,
  haiku,
  wallpaperMood,
  pauseInstanceId,
}: PauseDoneReflectShareRowProps) {
  const msg = (reflectionMessage ?? '').trim();
  const { onShareMenuOpen } = usePauseReflectUiTelemetry(pauseInstanceId, 'pause_done');
  if (!subscribed || !msg) return null;
  const mood = wallpaperMood && isPauseMoodValue(wallpaperMood) ? wallpaperMood : null;
  return (
    <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2 border-t border-border/25 pt-5">
      <ShareReflection
        message={msg}
        context={context ?? null}
        haiku={haiku ?? null}
        onMenuOpen={onShareMenuOpen}
      />
    </div>
  );
}
