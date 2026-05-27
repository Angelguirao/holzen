export type HomePauseOpeningPreviewKey =
  | 'home.pauseOpening.fearDown'
  | 'home.pauseOpening.extremeFearDown'
  | 'home.pauseOpening.greedUp'
  | 'home.pauseOpening.extremeGreedUp'
  | 'home.pauseOpening.downDefault'
  | 'home.pauseOpening.upDefault'
  | 'home.pauseOpening.neutral';

type FearGreedSnapshot = {
  value?: number;
  label?: string;
};

/** Picks a deterministic i18n key from `context_snapshot` (no LLM). */
export function buildHomePauseOpeningPreviewKey(
  snapshot: Record<string, unknown> | null | undefined,
): HomePauseOpeningPreviewKey {
  const direction =
    snapshot?.direction === 'down' ? 'down' : snapshot?.direction === 'up' ? 'up' : 'flat';
  const fg = snapshot?.fear_greed as FearGreedSnapshot | null | undefined;
  const label = (fg?.label ?? '').toLowerCase();
  const value = typeof fg?.value === 'number' ? fg.value : null;

  if (direction === 'down') {
    if (label.includes('extreme fear') || (value !== null && value <= 25)) {
      return 'home.pauseOpening.extremeFearDown';
    }
    if (label.includes('fear') || (value !== null && value <= 45)) {
      return 'home.pauseOpening.fearDown';
    }
    return 'home.pauseOpening.downDefault';
  }

  if (direction === 'up') {
    if (label.includes('extreme greed') || (value !== null && value >= 75)) {
      return 'home.pauseOpening.extremeGreedUp';
    }
    if (label.includes('greed') || (value !== null && value >= 55)) {
      return 'home.pauseOpening.greedUp';
    }
    return 'home.pauseOpening.upDefault';
  }

  return 'home.pauseOpening.neutral';
}
