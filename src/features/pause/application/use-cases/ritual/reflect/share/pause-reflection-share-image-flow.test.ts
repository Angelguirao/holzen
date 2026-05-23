import { describe, expect, it } from 'vitest';

import {
  deliverReflectionShareImage as deliverShareImageDirect,
} from './deliver-reflection-share-image';
import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';

import {
  deliverReflectionShareImage as deliverFromOrchestration,
  runReflectionShareImage as runFromOrchestration,
} from './pause-reflect-share-orchestration-flow';
import { runReflectionShareImage as runFromShareFlow } from './pause-reflect-share-flow';
import {
  deliverReflectionShareImage,
  runReflectionShareImage,
} from './pause-reflection-share-image-flow';

describe('pause-reflection-share-image-flow', () => {
  it('re-exports PNG share orchestration + deliver from leaf modules', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof deliverReflectionShareImage).toBe('function');

    expect(runReflectionShareImage).toBe(runShareImageDirect);
    expect(deliverReflectionShareImage).toBe(deliverShareImageDirect);
  });

  it('image subcluster anchor matches share orchestration umbrella (run + deliver)', () => {
    expect(runReflectionShareImage).toBe(runFromOrchestration);
    expect(deliverReflectionShareImage).toBe(deliverFromOrchestration);
  });

  it('image subcluster run binding matches share presentation umbrella (deliver omitted by design)', () => {
    expect(runReflectionShareImage).toBe(runFromShareFlow);
  });
});
