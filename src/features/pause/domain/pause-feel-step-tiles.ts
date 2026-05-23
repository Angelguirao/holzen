import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';

/** Ritual Feel step grid: tile id → mood value persisted on select. */
export const PAUSE_FEEL_STEP_TILE_ROWS: readonly { tile: FeelStepTile; mood: MoodValue }[] = [
  { tile: 'fomo', mood: 'fomo' },
  { tile: 'fearful', mood: 'fearful' },
  { tile: 'anxious', mood: 'anxious' },
  { tile: 'uncertain', mood: 'uncertain' },
  { tile: 'calm', mood: 'calm' },
  { tile: 'other', mood: 'uncertain' },
] as const;
