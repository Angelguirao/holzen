import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from './pause-reflect-session-ui-telemetry';

import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-pending-offer-telemetry-flow';
import {
  trackPauseReflectPostItOpen as trackPostItFromShareFlow,
  trackPauseReflectShareTap as trackShareTapFromShareFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromShareFlow,
} from '../share/pause-reflect-share-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-flow';
import {
  buildReflectionShareText as buildShareTextFromShareFlow,
  runReflectionShareImage as runShareImageFromShareFlow,
} from '../share/pause-reflect-share-flow';
import {
  formatReinforcementQuoteFromSession as formatQuoteFromFlowsFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlowsFlow,
} from '../flows/pause-reflect-flows-flow';

describe('pause-reflect-telemetry-flow', () => {
  it('re-exports session reflect UI telemetry trackers from pause-reflect-session-ui-telemetry', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
  });

  it('telemetry subcluster bindings match share presentation umbrella (cross-umbrella parity)', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromShareFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromShareFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromShareFlow);
  });

  it('sibling cluster: session reflect UI telemetry-flow exports stay distinct from pending-offer-telemetry-flow exports', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPausePendingAdopted);
    expect(trackPauseReflectShareTap).not.toBe(trackPausePendingDeclined);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseSessionAbandoned);
  });

  it('sibling cluster: session reflect UI telemetry-flow exports stay distinct from share-flow exports', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runShareImageFromShareFlow);
    expect(trackPauseReflectShareTap).not.toBe(runShareImageFromShareFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(runShareImageFromShareFlow);
    expect(trackPauseReflectPostItOpen).not.toBe(buildShareTextFromShareFlow);
    expect(trackPauseReflectShareTap).not.toBe(buildShareTextFromShareFlow);
  });

  it('sibling cluster: session reflect UI telemetry-flow exports stay distinct from flows-flow exports', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePreflightFromFlowsFlow);
    expect(trackPauseReflectShareTap).not.toBe(resolvePreflightFromFlowsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackPauseReflectPostItOpen).not.toBe(formatQuoteFromFlowsFlow);
    expect(trackPauseReflectShareTap).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(formatQuoteFromFlowsFlow);
  });
});
