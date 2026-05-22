import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../telemetry/pause-reflect-telemetry-flow';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
import * as telemetryFlow from '../telemetry/pause-reflect-telemetry-flow';

describe('pause-reflect-flows-flow ↔ pause-reflect-telemetry-flow sibling parity', () => {
  it('flows-flow and telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in flowsFlow).toBe(false);
    expect('trackPauseReflectShareTap' in flowsFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in telemetryFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in telemetryFlow).toBe(false);
    expect('formatReinforcementQuoteFromSession' in telemetryFlow).toBe(false);
    expect('runPauseOutcomeLog' in telemetryFlow).toBe(false);
    expect('buildPauseScoreImpacts' in telemetryFlow).toBe(false);
  });

  it('flows umbrella exports stay off session reflect UI telemetry trackers', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(trackPauseReflectPostItOpen);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(trackPauseReflectShareTap);
    expect(formatReinforcementQuoteFromSession).not.toBe(trackPauseReflectWallpaperTap);
    expect(runPauseOutcomeLog).not.toBe(trackPauseReflectPostItOpen);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(trackPauseReflectShareTap);
    expect(buildPauseScoreImpacts).not.toBe(trackPauseReflectWallpaperTap);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(trackPauseReflectPostItOpen);
  });

  it('telemetry umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectShareTap).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(formatReinforcementQuoteFromSession);
    expect(trackPauseReflectPostItOpen).not.toBe(runPauseOutcomeLog);
    expect(trackPauseReflectShareTap).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildPauseScoreImpacts);
    expect(trackPauseReflectPostItOpen).not.toBe(showPauseOutcomeNotCompletedToast);
  });
});
