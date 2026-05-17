/** Limits aligned with `LetterToFutureSelf` + `WritingField` maxLength. */
export const FUTURE_LETTER_MAX_CHARS = 500;
export const FUTURE_LETTER_MIN_CHARS = 25;
export const FUTURE_LETTER_MIN_WORDS = 3;

export type FutureLetterInvalidReason =
  | 'too_short'
  | 'too_long'
  | 'too_few_words'
  | 'too_repetitive';

export type FutureLetterValidation =
  | { valid: true }
  | { valid: false; reason: FutureLetterInvalidReason };

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/gi, '');
}

/**
 * Client-side checks before sealing: length, word count, and obvious keyboard-mash
 * (e.g. one long token or the same word repeated).
 */
export function validateFutureLetterBody(raw: string): FutureLetterValidation {
  const body = raw.trim();
  if (body.length < FUTURE_LETTER_MIN_CHARS) {
    return { valid: false, reason: 'too_short' };
  }
  if (body.length > FUTURE_LETTER_MAX_CHARS) {
    return { valid: false, reason: 'too_long' };
  }
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length < FUTURE_LETTER_MIN_WORDS) {
    return { valid: false, reason: 'too_few_words' };
  }
  const normalized = words.map(normalizeWord).filter((w) => w.length > 0);
  const unique = new Set(normalized);
  if (unique.size < 2) {
    return { valid: false, reason: 'too_repetitive' };
  }
  return { valid: true };
}
