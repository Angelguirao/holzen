import { ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { resumePauseAudioContext } from '@/features/pause/public';

export type PauseSessionScaffoldBodyChromeProps = {
  onHeaderBack?: () => void;
  showHeaderBack?: boolean;
  macroStepIndex?: number;
  macroStepTotal?: number;
  macroProgressLine?: string;
  macroProgressSubline?: string;
  muted: boolean;
  setMuted: (muted: boolean) => void;
};

/** Body row below header: back, macro progress copy, ritual mute. */
export function PauseSessionScaffoldBodyChrome({
  onHeaderBack,
  showHeaderBack = false,
  macroStepIndex,
  macroStepTotal,
  macroProgressLine,
  macroProgressSubline,
  muted,
  setMuted,
}: PauseSessionScaffoldBodyChromeProps) {
  const { t } = useTranslation();

  const showMeta =
    macroProgressSubline != null ||
    macroProgressLine != null ||
    (macroStepIndex != null && macroStepTotal != null && macroStepTotal > 0);

  return (
    <div className="relative mb-8 flex w-full min-h-[2.5rem] items-start justify-center sm:mb-10">
      <div className="absolute left-0 top-0.5 z-10">
        {onHeaderBack && showHeaderBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onHeaderBack}
            aria-label={t('pause.steps.back', { defaultValue: 'Back' })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="mx-auto max-w-[min(100%,16rem)] flex-1 px-11 text-center sm:px-12">
        {showMeta &&
          (macroProgressSubline != null ||
          (macroProgressLine != null &&
            macroStepIndex != null &&
            macroStepTotal != null &&
            macroStepTotal > 0) ? (
            <div className="flex flex-col items-center gap-0 text-muted-foreground">
              <p className="text-base font-medium italic leading-6">
                {macroProgressLine ??
                  t('pause.deep.macroStepCount', {
                    defaultValue: '{{n}} of {{total}}',
                    n: macroStepIndex,
                    total: macroStepTotal,
                  })}
              </p>
              {macroProgressSubline ? (
                <p className="text-base font-normal leading-6">{macroProgressSubline}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {macroProgressLine ??
                  t('pause.macroProgress', {
                    defaultValue: '{{n}} of {{total}} · under ~15 min',
                    n: macroStepIndex,
                    total: macroStepTotal,
                  })}
              </p>
            </div>
          ))}
      </div>

      <div className="absolute right-0 top-0.5 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={
            muted
              ? 'h-9 w-9 shrink-0 text-muted-foreground/70 hover:text-foreground'
              : 'h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground'
          }
          onClick={() => {
            setMuted(!muted);
            if (muted) void resumePauseAudioContext();
          }}
          aria-label={
            muted
              ? t('pause.muteAriaOff', { defaultValue: 'Sound off (tap to unmute)' })
              : t('pause.muteAriaOn', { defaultValue: 'Sound on (tap to mute)' })
          }
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}
