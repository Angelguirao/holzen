import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import { clampFeelIntensity } from '@/features/pause/domain/mood-value';
import type { CurrentFeelForReflect } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

export type BuildCurrentFeelForReflectInput = {
  mood: MoodValue | null;
  intensity: number | null | undefined;
  tile: FeelStepTile | null;
  /** Pre-resolved i18n label for the Feel tile (optional). */
  tileLabel?: string | null;
};

/** Structured Feel snapshot for `holzen-reflect` (deep ritual Reflect step). */
export function buildCurrentFeelForReflect(
  input: BuildCurrentFeelForReflectInput,
): CurrentFeelForReflect | undefined {
  if (!input.mood) return undefined;
  const feel: CurrentFeelForReflect = { mood: input.mood };
  if (typeof input.intensity === 'number') {
    feel.intensity = clampFeelIntensity(input.intensity);
  }
  if (input.tile) {
    feel.tileId = input.tile;
    if (input.tileLabel?.trim()) feel.tileLabel = input.tileLabel.trim();
  }
  return feel;
}
