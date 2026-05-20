import { useCallback } from 'react';
import type { FeelStepTile, MoodValue } from '@/features/pause/public';

/**
 * Wraps `handleMoodSelect` for `PauseRitualFeelStep` (shared brief + deep Feel step).
 * Brief adds `brief_ritual` to the step payload; deep only sends mood, intensity, and `brief_face` tile.
 */
export function usePauseSessionFeelTilesSelect(input: {
  handleMoodSelect: (
    mood: MoodValue,
    intensity?: number,
    opts?: { briefRitual?: boolean; briefFace?: FeelStepTile },
  ) => void | Promise<void>;
  isBriefRitual: boolean;
}): { onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: FeelStepTile) => void } {
  const { handleMoodSelect, isBriefRitual } = input;

  const onFeelTilesSelect = useCallback(
    (mood: MoodValue, intensity: number, tile: FeelStepTile) => {
      void handleMoodSelect(mood, intensity, isBriefRitual ? { briefRitual: true, briefFace: tile } : { briefFace: tile });
    },
    [handleMoodSelect, isBriefRitual],
  );

  return { onFeelTilesSelect };
}
