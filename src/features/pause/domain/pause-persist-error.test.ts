import { describe, expect, it } from 'vitest';
import {
  PAUSE_PERSIST_ERROR_MARKER,
  REFLECTION_PERSIST_ERROR_MARKER,
  isPausePersistError,
  isReflectionPersistError,
  reflectionPersistErrorMessage,
} from './pause-persist-error';

describe('isReflectionPersistError', () => {
  it('matches pause and legacy reflection markers', () => {
    expect(isReflectionPersistError(`prefix ${PAUSE_PERSIST_ERROR_MARKER} suffix`)).toBe(true);
    expect(isReflectionPersistError(REFLECTION_PERSIST_ERROR_MARKER)).toBe(true);
    expect(isPausePersistError(REFLECTION_PERSIST_ERROR_MARKER)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isReflectionPersistError(null)).toBe(false);
    expect(isReflectionPersistError('Could not reach Holzen')).toBe(false);
  });
});

describe('reflectionPersistErrorMessage', () => {
  it('uses network copy when insert error looks like connectivity', () => {
    expect(reflectionPersistErrorMessage({ message: 'Failed to fetch' })).toContain('Check your connection');
  });

  it('uses generic retry copy for other failures', () => {
    expect(reflectionPersistErrorMessage({ message: 'duplicate key' })).toContain('Try again in a moment');
  });
});
