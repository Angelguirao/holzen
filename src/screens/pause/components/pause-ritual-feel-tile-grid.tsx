import { useTranslation } from 'react-i18next';
import { MoodIcon } from '@/components/icons/MoodIcon';
import type { MoodValue } from '@/features/pause/public-hooks';
import type { FeelStepTile } from '@/features/pause/public';
import { PAUSE_FEEL_STEP_TILE_ROWS } from '@/features/pause/public-hooks';
import { cn } from '@/lib/utils';

export type PauseRitualFeelTileGridProps = {
  activeTile: FeelStepTile | null;
  onPickTile: (tile: FeelStepTile, mood: MoodValue) => void;
};

/** 3×2 Feel tile grid for brief and deep pause rituals. */
export function PauseRitualFeelTileGrid({ activeTile, onPickTile }: PauseRitualFeelTileGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-4">
      {PAUSE_FEEL_STEP_TILE_ROWS.map(({ tile: tk, mood }) => {
        const active = activeTile === tk;
        return (
          <button
            key={tk}
            type="button"
            onClick={() => onPickTile(tk, mood)}
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
  );
}
