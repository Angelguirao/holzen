import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { InitialEmotionLogOpts } from '@/features/pause/domain/feel/initial-emotion-log';

/** Options for `initial_emotion_logged` when the Feel tiles row fires. */
export function buildFeelTilesMoodLogOptions(
  isBriefRitual: boolean,
  tile: FeelStepTile,
): InitialEmotionLogOpts {
  return isBriefRitual ? { briefRitual: true, briefFace: tile } : { briefFace: tile };
}
