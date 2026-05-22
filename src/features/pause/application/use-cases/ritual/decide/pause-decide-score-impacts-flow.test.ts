import { describe, expect, it } from 'vitest';

import {
  buildPauseScoreImpacts as buildImpactsDirect,
  parseScoreImpactVolatilityPct as parseVolatilityDirect,
} from './score-impacts';
import {
  resolveScoreImpactDisplayImpacts as resolveDisplayDirect,
  resolveScoreImpactViewMode as resolveViewModeDirect,
  scoreImpactMotionDelaySec as motionDelayDirect,
} from './score-impact-presentation';

import {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
} from './pause-decide-score-impacts-flow';

describe('pause-decide-score-impacts-flow', () => {
  it('re-exports score-impact builders from score-impacts and score-impact-presentation leaves', () => {
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof parseScoreImpactVolatilityPct).toBe('function');
    expect(typeof resolveScoreImpactDisplayImpacts).toBe('function');
    expect(typeof resolveScoreImpactViewMode).toBe('function');
    expect(typeof scoreImpactMotionDelaySec).toBe('function');

    expect(buildPauseScoreImpacts).toBe(buildImpactsDirect);
    expect(parseScoreImpactVolatilityPct).toBe(parseVolatilityDirect);
    expect(resolveScoreImpactDisplayImpacts).toBe(resolveDisplayDirect);
    expect(resolveScoreImpactViewMode).toBe(resolveViewModeDirect);
    expect(scoreImpactMotionDelaySec).toBe(motionDelayDirect);
  });
});
