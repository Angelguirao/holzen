import { describe, expect, it } from 'vitest';
import {
  isAbortLikeReflectError,
  reflectGenerationUserErrorMessage,
} from './reflect-generation-errors';

describe('isAbortLikeReflectError', () => {
  it('detects AbortError by name', () => {
    expect(isAbortLikeReflectError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isAbortLikeReflectError(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toBe(true);
    expect(isAbortLikeReflectError(new Error('other'))).toBe(false);
  });
});

describe('reflectGenerationUserErrorMessage', () => {
  it('maps network failures', () => {
    expect(reflectGenerationUserErrorMessage('Failed to fetch')).toContain('connection');
  });

  it('maps rate limits', () => {
    expect(reflectGenerationUserErrorMessage('429 rate limited')).toContain('Too many requests');
  });

  it('falls back to generic copy', () => {
    expect(reflectGenerationUserErrorMessage('model timeout')).toContain('unavailable');
  });
});
