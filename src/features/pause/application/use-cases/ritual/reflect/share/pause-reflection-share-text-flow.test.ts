import { describe, expect, it } from 'vitest';

import { buildReflectionShareText as buildTextDirect } from '@/features/pause/domain/reflect/share/reflection-share-text';

import { buildReflectionShareText } from './pause-reflection-share-text-flow';

describe('pause-reflection-share-text-flow', () => {
  it('re-exports plain-text builder from domain/reflect/share', () => {
    expect(typeof buildReflectionShareText).toBe('function');
    expect(buildReflectionShareText).toBe(buildTextDirect);
  });
});
