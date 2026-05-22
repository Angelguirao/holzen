import { describe, expect, it } from 'vitest';

import {
  deliverReflectionShareImage as deliverShareImageDirect,
} from './deliver-reflection-share-image';
import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';
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
});
