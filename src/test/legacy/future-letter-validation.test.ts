import { describe, expect, it } from 'vitest';
import {
  FUTURE_LETTER_MAX_CHARS,
  FUTURE_LETTER_MIN_CHARS,
  validateFutureLetterBody,
} from '@/legacy/full-shell/src/lib/future-letter-validation';

describe('validateFutureLetterBody', () => {
  it('rejects short and few-word input', () => {
    expect(validateFutureLetterBody('a'.repeat(FUTURE_LETTER_MIN_CHARS - 1)).valid).toBe(false);
    expect(validateFutureLetterBody('hello world').valid).toBe(false); // 2 words
  });

  it('rejects single repeated token mash', () => {
    expect(validateFutureLetterBody('ggregrwegrwegrewgregewgewrgewgewgregrewgew').valid).toBe(false);
  });

  it('accepts a short sincere letter', () => {
    const ok =
      'When fear hits I want to remember that volatility is normal and my plan was made in calm. Breathe before acting.';
    expect(validateFutureLetterBody(ok).valid).toBe(true);
  });

  it('rejects over max length', () => {
    const long = `${'word '.repeat(200)}end`;
    expect(long.length).toBeGreaterThan(FUTURE_LETTER_MAX_CHARS);
    expect(validateFutureLetterBody(long).valid).toBe(false);
  });
});
