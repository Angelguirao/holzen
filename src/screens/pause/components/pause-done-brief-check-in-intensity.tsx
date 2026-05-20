import { useTranslation } from 'react-i18next';
import { PAUSE_FEEL_INTENSITY_KEYS } from '@/features/pause/public-hooks';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

export type PauseDoneBriefCheckInIntensityProps = {
  intensity: number;
  onIntensityChange: (intensity: number) => void;
};

/** Brief Done check-in intensity slider (1–5) with compact label row. */
export function PauseDoneBriefCheckInIntensity({ intensity, onIntensityChange }: PauseDoneBriefCheckInIntensityProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 space-y-2.5">
      <Slider
        aria-label={t('pause.feelStep.intensityTitle', { defaultValue: 'How strong?' })}
        min={1}
        max={5}
        step={1}
        value={[intensity]}
        onValueChange={(v) => onIntensityChange(Math.min(5, Math.max(1, v[0] ?? 3)))}
        className="w-full py-1"
      />
      <div className="flex justify-between gap-1 px-0.5 text-center text-[10px] text-muted-foreground sm:text-xs">
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
  );
}
