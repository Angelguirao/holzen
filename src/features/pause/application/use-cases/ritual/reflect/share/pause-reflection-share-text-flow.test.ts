import { describe, expect, it } from 'vitest';

import { buildReflectionShareText } from './pause-reflection-share-text-flow';

describe('pause-reflection-share-text-flow', () => {
  it('re-exports plain-text builder from domain/reflect/share', () => {
    expect(typeof buildReflectionShareText).toBe('function');
  });
});
