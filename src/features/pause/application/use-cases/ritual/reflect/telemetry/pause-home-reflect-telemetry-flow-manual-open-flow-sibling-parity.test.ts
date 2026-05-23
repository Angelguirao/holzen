import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
import * as homeReflectTelemetryFlow from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '../generation/manual-open/pause-reflect-generation-manual-open-flow';
import * as manualOpenFlow from '../generation/manual-open/pause-reflect-generation-manual-open-flow';

/**
 * Application sibling parity: Home manual-open telemetry-flow vs manual-open-flow CI anchors.
 * Complements `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts`
 * and `pause-reflect-generation-manual-open-flow-sibling-parity.test.ts`.
 */
describe('pause-home-reflect-telemetry-flow ↔ pause-reflect-generation-manual-open-flow sibling parity', () => {
  it('home-reflect-telemetry-flow and manual-open-flow are distinct sibling CI anchors', () => {
    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');

    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof buildManualPauseMarketContext).toBe('function');
    expect(typeof buildManualPauseOpenParams).toBe('function');
    expect(typeof buildManualPauseCreateOrReuseParams).toBe('function');

    expect('openManualPauseFromHome' in homeReflectTelemetryFlow).toBe(false);
    expect('dismissOpenPauseHome' in homeReflectTelemetryFlow).toBe(false);
    expect('buildManualPauseOpenParams' in homeReflectTelemetryFlow).toBe(false);

    expect('trackPauseOpenDismissed' in manualOpenFlow).toBe(false);
    expect('trackHomePendingPauseBannerPauseOpened' in manualOpenFlow).toBe(false);
    expect('markPauseManualStartedHomeOnce' in manualOpenFlow).toBe(false);
    expect('trackManualPauseInstanceCreated' in manualOpenFlow).toBe(false);
    expect('trackPauseManualCompleted' in manualOpenFlow).toBe(false);
  });

  it('home manual-open telemetry exports stay off manual-open use cases and domain builders', () => {
    expect(trackPauseOpenDismissed).not.toBe(openManualPauseFromHome);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(dismissOpenPauseHome);
    expect(markPauseManualStartedHomeOnce).not.toBe(runOpenManualPauseSilentModeAfterCreate);
    expect(trackManualPauseInstanceCreated).not.toBe(runPersistSilentReflectionStub);
    expect(trackPauseManualCompleted).not.toBe(buildManualPauseMarketContext);
    expect(trackPauseOpenDismissed).not.toBe(buildManualPauseCreateOrReuseParams);
  });

  it('manual-open-flow exports stay off Home PostHog trackers', () => {
    expect(openManualPauseFromHome).not.toBe(trackPauseOpenDismissed);
    expect(dismissOpenPauseHome).not.toBe(trackHomePendingPauseBannerPauseOpened);
    expect(runOpenManualPauseSilentModeAfterCreate).not.toBe(markPauseManualStartedHomeOnce);
    expect(runPersistSilentReflectionStub).not.toBe(trackManualPauseInstanceCreated);
    expect(buildManualPauseOpenParams).not.toBe(trackPauseManualCompleted);
    expect(buildManualPauseMarketContext).not.toBe(trackPauseOpenDismissed);
  });
});
