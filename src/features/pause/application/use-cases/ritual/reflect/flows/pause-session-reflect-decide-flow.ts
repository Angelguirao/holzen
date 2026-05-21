import { isPauseReflectGenerationEnabled } from '@/features/pause/domain/reflect/generation/reflect-generation-enabled';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

/** Market severity input for `holzen-reflect` (absolute BTC change %). */
export function resolveReflectGenerationSeverityAbsPct(changePercent: number | null | undefined): number {
  return Math.abs(changePercent ?? 0);
}

/** Prefer generated copy when non-empty; otherwise keep session message seed. */
export function resolveEffectiveReflectionMessage(
  generatedMessage: string,
  sessionMessage: string,
): string {
  const trimmed = generatedMessage.trim();
  return trimmed || sessionMessage;
}

export function shouldRunPauseReflectGeneration(
  ritualEntry: RitualDepth | 'picker',
  step: PauseStep,
): boolean {
  return isPauseReflectGenerationEnabled(ritualEntry, step);
}
