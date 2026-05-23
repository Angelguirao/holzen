import { describe, expect, it } from 'vitest';

import {
  deliverReflectionShareImage,
  runReflectionShareImage as runShareImageFromOrchestrationFlow,
} from './pause-reflect-share-orchestration-flow';
import {
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-share-flow';
import * as shareFlow from './pause-reflect-share-flow';
import * as orchestrationFlow from './pause-reflect-share-orchestration-flow';

describe('pause-reflect-share-flow ↔ pause-reflect-share-orchestration-flow sibling parity', () => {
  it('share-flow and share-orchestration-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof deliverReflectionShareImage).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('runReflectionShareImage' in shareFlow).toBe(true);
    expect('trackPauseReflectPostItOpen' in shareFlow).toBe(true);
    expect('trackPauseReflectShareTap' in shareFlow).toBe(true);
    expect('trackPauseReflectWallpaperTap' in shareFlow).toBe(true);
    expect('deliverReflectionShareImage' in shareFlow).toBe(false);

    expect('runReflectionShareImage' in orchestrationFlow).toBe(true);
    expect('deliverReflectionShareImage' in orchestrationFlow).toBe(true);
    expect('trackPauseReflectPostItOpen' in orchestrationFlow).toBe(false);
    expect('trackPauseReflectShareTap' in orchestrationFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in orchestrationFlow).toBe(false);
  });

  it('share umbrella re-exports session UI telemetry, not native deliver leaf', () => {
    expect(runReflectionShareImage).toBe(runShareImageFromOrchestrationFlow);
    expect(runReflectionShareImage).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectPostItOpen).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(runShareImageFromOrchestrationFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(deliverReflectionShareImage);
  });

  it('orchestration umbrella re-exports deliver leaf, not session UI telemetry', () => {
    expect(deliverReflectionShareImage).not.toBe(trackPauseReflectPostItOpen);
    expect(deliverReflectionShareImage).not.toBe(trackPauseReflectShareTap);
    expect(deliverReflectionShareImage).not.toBe(trackPauseReflectWallpaperTap);
    expect(runShareImageFromOrchestrationFlow).not.toBe(trackPauseReflectPostItOpen);
    expect(runShareImageFromOrchestrationFlow).not.toBe(trackPauseReflectWallpaperTap);
  });
});
