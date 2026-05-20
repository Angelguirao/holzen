import { useTranslation } from 'react-i18next';
import { PAUSE_FEEL_INTENSITY_KEYS } from '@/features/pause/public';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export type PauseRitualFeelIntensitySliderProps = {
  intensity: number;
  onIntensityChange: (intensity: number) => void;
};

/** Feel step intensity slider (1–5) with label row. */
export function PauseRitualFeelIntensitySlider({ intensity, onIntensityChange }: PauseRitualFeelIntensitySliderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-center text-base text-foreground">
        {t('pause.feelStep.intensityTitle', { defaultValue: 'How strong?' })}
      </p>
      <div className="space-y-2.5">
        <Slider
          aria-label={t('pause.feelStep.intensityTitle', { defaultValue: 'How strong?' })}
          min={1}
          max={5}
          step={1}
          value={[intensity]}
          onValueChange={(v) => onIntensityChange(v[0] ?? 3)}
          className="w-full py-1"
        />
        <div className="flex justify-between gap-1 px-0.5 text-center text-xs text-muted-foreground sm:text-sm">
          {PAUSE_FEEL_INTENSITY_KEYS.map((key) => (
            <span
              key={key}
              className={cn(
                'min-w-0 flex-1 truncate',
                key === PAUSE_FEEL_INTENSITY_KEYS[intensity - 1] && 'font-medium text-foreground',
              )}
            >
              {t(`pause.feelStep.intensity.${key}`, { defaultValue: key })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
