/**
 * CI cluster anchor for decide outcome score-impact rows (§3).
 * Pure builders live in `score-impacts` / `score-impact-presentation`; re-export for reflect flows I/O.
 */
export {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  type PauseScoreImpactRow,
} from './score-impacts';
export {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from './score-impact-presentation';
