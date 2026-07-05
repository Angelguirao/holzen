import { describe, expect, it } from 'vitest';
import { reflectionContentV2 } from './reflection-content-v2';
import {
  formatReflectDisplayLetter,
  normalizeReflectLetter,
} from './format-reflect-display-letter';

describe('normalizeReflectLetter', () => {
  it('merges middle paragraphs and keeps closing question separate', () => {
    const input =
      'Para one.\n\nPara two.\n\nWhat story are you telling yourself about security?';
    expect(normalizeReflectLetter(input)).toBe(
      'Para one. Para two.\n\nWhat story are you telling yourself about security?',
    );
  });
});

describe('formatReflectDisplayLetter', () => {
  it('uses message only and omits context strip', () => {
    const content = reflectionContentV2({
      land: 'Land.',
      hypothesis: 'Hyp.',
      inquiry: 'Question?',
      contextStrip: 'Strip must not appear in letter.',
      integratedMessage: 'One voice paragraph with a closing question?',
    });
    expect(formatReflectDisplayLetter(content)).toBe(
      'One voice paragraph with a closing question?',
    );
    expect(formatReflectDisplayLetter(content)).not.toContain('Strip');
  });

  it('falls back to one-voice stitch when message is short', () => {
    const content = reflectionContentV2({
      land: 'The move is sharp.',
      hypothesis: 'This might feel personal.',
      inquiry: 'What story are you telling yourself',
      contextStrip: null,
    });
    const letter = formatReflectDisplayLetter(content);
    expect(letter).not.toContain('\n\n');
    expect(letter).toContain('?');
  });
});
