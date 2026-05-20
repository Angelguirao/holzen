import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS } from '@/screens/pause/lib/pause-depth-picker-styles';

type PauseDepthPickerDepthCardsProps = {
  onBrief: () => void;
  onDeep: () => void;
  deepPauseLocked?: boolean;
};

export function PauseDepthPickerDepthCards({
  onBrief,
  onDeep,
  deepPauseLocked = false,
}: PauseDepthPickerDepthCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={onBrief}
        className={cn(PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS, 'bg-muted/25 hover:bg-muted/40')}
      >
        <span className="text-base font-medium text-muted-foreground">
          {t('pause.depthPicker.brief.label', { defaultValue: 'Brief pause' })}
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          {t('pause.depthPicker.brief.duration', { defaultValue: '~ 2 min' })}
        </span>
        <span className="text-sm leading-5 text-foreground">
          {t('pause.depthPicker.brief.desc', { defaultValue: 'Steady yourself, then decide.' })}
        </span>
      </button>

      <button
        type="button"
        onClick={onDeep}
        className={cn(
          PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS,
          'bg-muted/50 hover:bg-muted/65',
          deepPauseLocked && 'opacity-80 ring-1 ring-border/60',
        )}
        aria-label={
          deepPauseLocked
            ? t('pause.depthPicker.deep.ariaLocked')
            : t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })
        }
      >
        <span className="flex w-full items-center justify-center gap-2">
          <span className="text-base font-medium text-muted-foreground">
            {t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })}
          </span>
          {deepPauseLocked ? (
            <span className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('pause.depthPicker.deep.proRequiredHint', { defaultValue: 'Pro or free trial' })}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          {t('pause.depthPicker.deep.duration', { defaultValue: '~ 7 min' })}
        </span>
        <span className="text-sm leading-5 text-foreground">
          {t('pause.depthPicker.deep.desc', {
            defaultValue: 'Sit with it. Reflect. Decide from your center.',
          })}
        </span>
      </button>
    </div>
  );
}
