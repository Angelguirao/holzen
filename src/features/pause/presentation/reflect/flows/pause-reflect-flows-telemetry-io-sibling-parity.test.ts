import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-reflect-flows-io';
import * as flowsIo from './pause-reflect-flows-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

describe('pause-reflect-flows-io ↔ pause-reflect-telemetry-io sibling parity', () => {
  it('flows-io and telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in flowsIo).toBe(false);
    expect('trackPauseReflectShareTap' in flowsIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in flowsIo).toBe(false);

    expect('pauseReflectOutcomeLog' in telemetryIo).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in telemetryIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in telemetryIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in telemetryIo).toBe(false);
    expect('formatReinforcementQuoteFromSession' in telemetryIo).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in telemetryIo).toBe(false);
    expect('getSessionQuote' in telemetryIo).toBe(false);
    expect('buildPauseScoreImpacts' in telemetryIo).toBe(false);
    expect('showPauseOutcomeNotCompletedToast' in telemetryIo).toBe(false);
    expect('showPauseOutcomeSaveFailedToast' in telemetryIo).toBe(false);
    expect('reflectPauseRepository' in telemetryIo).toBe(false);
  });

  it('reflect+decide flows I/O keeps outcome RPC wrappers off session UI telemetry trackers', () => {
    expect(pauseReflectOutcomeLog).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(trackPauseReflectWallpaperTap);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(formatReinforcementQuoteFromSession).not.toBe(trackPauseReflectShareTap);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(trackPauseReflectWallpaperTap);
    expect(getSessionQuote).not.toBe(trackPauseReflectPostItOpen);
    expect(buildPauseScoreImpacts).not.toBe(trackPauseReflectShareTap);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(trackPauseReflectWallpaperTap);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(trackPauseReflectPostItOpen);
  });

  it('session reflect UI telemetry I/O keeps PostHog trackers off decide outcome helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectOutcomeLog);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(trackPauseReflectShareTap).not.toBe(formatReinforcementQuoteFromSession);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(trackPauseReflectPostItOpen).not.toBe(getSessionQuote);
    expect(trackPauseReflectShareTap).not.toBe(buildPauseScoreImpacts);
    expect(trackPauseReflectWallpaperTap).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(trackPauseReflectPostItOpen).not.toBe(showPauseOutcomeSaveFailedToast);
  });
});
