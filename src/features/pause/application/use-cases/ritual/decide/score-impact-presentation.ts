import type { PauseScoreImpactRow } from '@/features/pause/application/use-cases/ritual/decide/score-impacts';

export type ScoreImpactVariant = 'default' | 'brief';

export type ScoreImpactViewMode = 'hidden' | 'brief_empty' | 'brief_hidden' | 'list';

export function resolveScoreImpactDisplayImpacts(
  impacts: readonly PauseScoreImpactRow[],
  excludeFirstFromList: boolean,
): PauseScoreImpactRow[] {
  return excludeFirstFromList ? impacts.slice(1) : [...impacts];
}

/** Which `ScoreImpact` surface to render (early-return parity with legacy component). */
export function resolveScoreImpactViewMode(input: {
  impacts: readonly PauseScoreImpactRow[];
  variant: ScoreImpactVariant;
  excludeFirstFromList: boolean;
}): ScoreImpactViewMode {
  const { impacts, variant, excludeFirstFromList } = input;
  if (impacts.length === 0 && variant !== 'brief') return 'hidden';
  if (impacts.length === 0 && variant === 'brief') return 'brief_empty';

  const display = resolveScoreImpactDisplayImpacts(impacts, excludeFirstFromList);
  if (variant === 'brief' && display.length === 0) return 'brief_hidden';

  return 'list';
}

export function scoreImpactMotionDelaySec(variant: ScoreImpactVariant): number {
  return variant === 'brief' ? 0.25 : 0.8;
}
