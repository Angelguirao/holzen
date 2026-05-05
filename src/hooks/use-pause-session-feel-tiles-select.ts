import { useCallback } from 'react';
import type { MoodValue } from '@/components/MoodCheck';
import type { BriefFeelTile } from '@/components/pause/PauseBriefFeel';

/**
 * Wraps `handleMoodSelect` for `PauseBriefFeel` (shared brief + deep Feel step).
 * Brief adds `brief_ritual` to the step payload; deep only sends mood, intensity, and `brief_face` tile.
 */
export function usePauseSessionFeelTilesSelect(input: {
  handleMoodSelect: (
    mood: MoodValue,
    intensity?: number,
    opts?: { briefRitual?: boolean; briefFace?: BriefFeelTile },
  ) => void | Promise<void>;
  isBriefRitual: boolean;
}): { onFeelTilesSelect: (mood: MoodValue, intensity: number, tile: BriefFeelTile) => void } {
  const { handleMoodSelect, isBriefRitual } = input;

  const onFeelTilesSelect = useCallback(
    (mood: MoodValue, intensity: number, tile: BriefFeelTile) => {
      void handleMoodSelect(mood, intensity, isBriefRitual ? { briefRitual: true, briefFace: tile } : { briefFace: tile });
    },
    [handleMoodSelect, isBriefRitual],
  );

  return { onFeelTilesSelect };
}
