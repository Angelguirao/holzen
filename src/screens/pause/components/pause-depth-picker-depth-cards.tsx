import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS } from '@/features/pause/public-ritual-feel';

type PauseDepthPickerDepthCardsProps = {
  onBrief: () => void;
  onDeep: () => void;
  deepPauseLocked?: boolean;
  choicesDisabled?: boolean;
};

export function PauseDepthPickerDepthCards({
  onBrief,
  onDeep,
  deepPauseLocked = false,
  choicesDisabled = false,
}: PauseDepthPickerDepthCardsProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={onBrief}
        disabled={choicesDisabled}
        className={cn(
          PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS,
          'bg-muted/25 hover:bg-muted/40',
          choicesDisabled && 'pointer-events-none opacity-60',
        )}
      >
        <span className="text-base font-medium leading-6 tracking-[0.01em] text-muted-foreground">
          {t('pause.depthPicker.brief.label', { defaultValue: 'Brief pause' })}
        </span>
        <span className="text-sm font-normal leading-5 tracking-[0.008em] text-muted-foreground">
          {t('pause.depthPicker.brief.duration', { defaultValue: '~ 2 min' })}
        </span>
        <span className="text-sm leading-5 tracking-[0.008em] text-foreground">
          {t('pause.depthPicker.brief.desc', { defaultValue: 'Steady yourself, then decide.' })}
        </span>
      </button>

      <button
        type="button"
        onClick={onDeep}
        disabled={choicesDisabled}
        className={cn(
          PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS,
          'bg-muted/50 hover:bg-muted/65',
          deepPauseLocked && 'opacity-80 ring-1 ring-border/60',
          choicesDisabled && 'pointer-events-none opacity-60',
        )}
        aria-label={
          deepPauseLocked
            ? t('pause.depthPicker.deep.ariaLocked')
            : t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })
        }
      >
        <span className="flex w-full items-center justify-center gap-2">
          <span className="text-base font-medium leading-6 tracking-[0.01em] text-muted-foreground">
            {t('pause.depthPicker.deep.label', { defaultValue: 'Deep pause' })}
          </span>
          {deepPauseLocked ? (
            <span className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('pause.depthPicker.deep.proRequiredHint', { defaultValue: 'Pro or free trial' })}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-normal leading-5 tracking-[0.008em] text-muted-foreground">
          {t('pause.depthPicker.deep.duration', { defaultValue: '~ 7 min' })}
        </span>
        <span className="text-sm leading-5 tracking-[0.008em] text-foreground">
          {t('pause.depthPicker.deep.desc', {
            defaultValue: 'Sit with it. Reflect. Decide from your center.',
          })}
        </span>
      </button>
    </div>
  );
}
