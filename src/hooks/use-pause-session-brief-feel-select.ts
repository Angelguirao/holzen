import { useCallback } from 'react';
import type { MoodValue } from '@/components/MoodCheck';
import type { BriefFeelTile } from '@/components/pause/PauseBriefFeel';

/**
 * Wraps `handleMoodSelect` for `PauseBriefFeel`: always tags brief ritual + face tile for RPC payload.
 */
export function usePauseSessionBriefFeelSelect(input: {
  handleMoodSelect: (
    mood: MoodValue,
    intensity?: number,
    opts?: { briefRitual?: boolean; briefFace?: BriefFeelTile },
  ) => void | Promise<void>;
}): { onBriefFeelSelect: (mood: MoodValue, intensity: number, tile: BriefFeelTile) => void } {
  const { handleMoodSelect } = input;

  const onBriefFeelSelect = useCallback(
    (mood: MoodValue, intensity: number, tile: BriefFeelTile) => {
      void handleMoodSelect(mood, intensity, { briefRitual: true, briefFace: tile });
    },
    [handleMoodSelect],
  );

  return { onBriefFeelSelect };
}
