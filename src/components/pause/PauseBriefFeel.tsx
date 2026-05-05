import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MoodIcon } from '@/components/icons/MoodIcon';
import type { MoodValue } from '@/components/MoodCheck';
import { Button } from '@/components/ui/button';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { cn } from '@/lib/utils';

export type BriefFeelTile = 'fomo' | 'fearful' | 'anxious' | 'uncertain' | 'calm' | 'other';

const TILES: { tile: BriefFeelTile; mood: MoodValue }[] = [
  { tile: 'fomo', mood: 'fomo' },
  { tile: 'fearful', mood: 'fearful' },
  { tile: 'anxious', mood: 'anxious' },
  { tile: 'uncertain', mood: 'uncertain' },
  { tile: 'calm', mood: 'calm' },
  { tile: 'other', mood: 'uncertain' },
];

const INTENSITY_KEYS = ['faint', 'light', 'clear', 'strong', 'heavy'] as const;

interface Props {
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedTile: BriefFeelTile | null;
  feelIntensity: number | null;
  onSelect: (mood: MoodValue, intensity: number, tile: BriefFeelTile) => void;
  onContinue: () => void;
}

export function PauseBriefFeel({
  moodDone,
  selectedMood,
  selectedTile,
  feelIntensity,
  onSelect,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const [localTile, setLocalTile] = useState<BriefFeelTile | null>(selectedTile);
  const [localIntensity, setLocalIntensity] = useState<number | null>(feelIntensity);

  const tile = moodDone ? selectedTile : localTile;
  const intensity = moodDone ? feelIntensity : localIntensity;

  const pickTile = (briefTile: BriefFeelTile, mood: MoodValue) => {
    setLocalTile(briefTile);
    if (localIntensity != null) {
      onSelect(mood, localIntensity, briefTile);
    }
  };

  const pickIntensity = (n: number) => {
    setLocalIntensity(n);
    if (localTile) {
      const row = TILES.find((x) => x.tile === localTile);
      if (row) onSelect(row.mood, n, localTile);
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
        <div className="space-y-2 text-center">
          <h2 className={pauseStepLayout.screenTitle}>
            {t('pause.brief.feel.title', { defaultValue: "What's here?" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('pause.brief.feel.subtitle', { defaultValue: 'No need to be sure — pick what is closest.' })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TILES.map(({ tile: tk, mood }) => {
            const active = tile === tk;
            return (
              <button
                key={tk}
                type="button"
                onClick={() => pickTile(tk, mood)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-colors',
                  active
                    ? 'border-foreground/40 bg-foreground/5'
                    : 'border-border/60 bg-background/40 hover:border-border hover:bg-muted/40',
                )}
              >
                <MoodIcon mood={tk === 'other' ? 'uncertain' : mood} size={22} className="text-muted-foreground" />
                <span className="text-xs font-medium leading-tight text-foreground">
                  {t(`pause.brief.feel.tiles.${tk}`, {
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

        <div className="space-y-3">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('pause.brief.feel.intensityTitle', { defaultValue: 'How strong?' })}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {INTENSITY_KEYS.map((key, i) => {
              const n = i + 1;
              const active = intensity === n;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickIntensity(n)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/70 text-muted-foreground hover:border-nox-border-focus/40 hover:text-foreground',
                  )}
                >
                  {t(`pause.brief.feel.intensity.${key}`, { defaultValue: key })}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="button" className="w-full" disabled={!moodDone} onClick={onContinue}>
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
        </Button>
      </div>
    </motion.div>
  );
}
