import { describe, expect, it } from 'vitest';

import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';
import { runReflectionShareImage } from './pause-reflection-share-image-flow';

describe('pause-reflection-share-image-flow', () => {
  it('re-exports PNG share orchestration from run-reflection-share-image', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(runReflectionShareImage).toBe(runShareImageDirect);
  });
});
