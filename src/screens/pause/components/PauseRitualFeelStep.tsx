import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MoodIcon } from '@/components/icons/MoodIcon';
import type { MoodValue } from '@/screens/pause/components/MoodCheck';
import { PAUSE_FEEL_INTENSITY_KEYS, type FeelStepTile } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { pauseStepLayout } from '@/screens/pause/components/pause-step-layout';
import { cn } from '@/lib/utils';

const TILES: { tile: FeelStepTile; mood: MoodValue }[] = [
  { tile: 'fomo', mood: 'fomo' },
  { tile: 'fearful', mood: 'fearful' },
  { tile: 'anxious', mood: 'anxious' },
  { tile: 'uncertain', mood: 'uncertain' },
  { tile: 'calm', mood: 'calm' },
  { tile: 'other', mood: 'uncertain' },
];

interface Props {
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedTile: FeelStepTile | null;
  feelIntensity: number | null;
  onSelect: (mood: MoodValue, intensity: number, tile: FeelStepTile) => void;
  onContinue: () => void;
}

/** Shared Feel step for brief and deep pause rituals (tile grid + intensity slider). */
export function PauseRitualFeelStep({
  moodDone,
  selectedMood: _selectedMood,
  selectedTile,
  feelIntensity,
  onSelect,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const [localTile, setLocalTile] = useState<FeelStepTile | null>(selectedTile);
  const [localIntensity, setLocalIntensity] = useState(() => feelIntensity ?? 3);

  const tile = moodDone ? selectedTile : localTile;
  const intensity = moodDone ? (feelIntensity ?? 3) : localIntensity;

  const pickTile = (feelTile: FeelStepTile, mood: MoodValue) => {
    const n = moodDone ? (feelIntensity ?? 3) : localIntensity;
    setLocalTile(feelTile);
    onSelect(mood, n, feelTile);
  };

  const setIntensityAndSync = (n: number) => {
    setLocalIntensity(n);
    const activeTile = moodDone ? selectedTile : localTile;
    if (activeTile) {
      const row = TILES.find((x) => x.tile === activeTile);
      if (row) onSelect(row.mood, n, activeTile);
    }
  };

  return (
    <motion.div
      className={pauseStepLayout.columnTop}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-[22px] font-normal leading-7 tracking-tight text-foreground">
            {t('pause.feelStep.title', { defaultValue: "What's here?" })}
          </h2>
          <p className="text-base leading-6 text-muted-foreground">
            {t('pause.feelStep.subtitle', { defaultValue: 'No need to be sure' })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {TILES.map(({ tile: tk, mood }) => {
            const active = tile === tk;
            return (
              <button
                key={tk}
                type="button"
                onClick={() => pickTile(tk, mood)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors',
                  active
                    ? 'border-foreground/50 bg-foreground/5'
                    : 'border-muted-foreground/35 bg-muted/40 hover:border-muted-foreground/50 hover:bg-muted/55',
                )}
              >
                <MoodIcon mood={tk === 'other' ? 'uncertain' : mood} size={24} className="text-muted-foreground" />
                <span className="text-sm font-medium leading-5 text-muted-foreground">
                  {t(`pause.feelStep.tiles.${tk}`, {
                    defaultValue:
                      tk === 'fomo'
                        ? 'FOMO'
                        : tk === 'fearful'
                          ? 'Fearful'
                          : tk === 'anxious'
                            ? 'Anxious'
                            : tk === 'uncertain'
                              ? 'Uncertain'
                              : tk === 'calm'
                                ? 'Calm'
                                : 'Other',
                  })}
                </span>
              </button>
            );
          })}
        </div>

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
              onValueChange={(v) => setIntensityAndSync(v[0] ?? 3)}
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

        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            disabled={!moodDone}
            className={pauseStepLayout.ritualPrimaryOutlineCta}
            onClick={onContinue}
          >
            {t('pause.steps.continue', { defaultValue: 'Continue' })}
            <ChevronRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
