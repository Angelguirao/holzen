import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PAUSE_FEEL_STEP_TILE_ROWS, pauseStepLayout, type FeelStepTile, type MoodValue } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import { PauseRitualFeelIntensitySlider } from '@/screens/pause/components/pause-ritual-feel-intensity-slider';
import { PauseRitualFeelTileGrid } from '@/screens/pause/components/pause-ritual-feel-tile-grid';

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
      const row = PAUSE_FEEL_STEP_TILE_ROWS.find((x) => x.tile === activeTile);
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

        <PauseRitualFeelTileGrid activeTile={tile} onPickTile={pickTile} />

        <PauseRitualFeelIntensitySlider intensity={intensity} onIntensityChange={setIntensityAndSync} />

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
