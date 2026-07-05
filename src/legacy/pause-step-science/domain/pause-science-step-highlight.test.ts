import { describe, it, expect } from 'vitest';
import { stepHighlightsScienceRow } from './pause-science-step-highlight';

describe('stepHighlightsScienceRow', () => {
  it('highlights when current step matches row key', () => {
    expect(stepHighlightsScienceRow('feel', 'feel')).toBe(true);
    expect(stepHighlightsScienceRow('feel', 'breathe')).toBe(false);
    expect(stepHighlightsScienceRow(undefined, 'feel')).toBe(false);
  });
});
