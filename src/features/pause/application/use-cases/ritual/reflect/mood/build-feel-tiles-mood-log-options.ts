import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';

/** Options for `initial_emotion_logged` when the Feel tiles row fires. */
export function buildFeelTilesMoodLogOptions(
  isBriefRitual: boolean,
  tile: FeelStepTile,
): { briefRitual?: boolean; briefFace: FeelStepTile } {
  return isBriefRitual ? { briefRitual: true, briefFace: tile } : { briefFace: tile };
}
