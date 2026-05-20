import { describe, expect, it } from 'vitest';
import { stepHighlightsScienceRow } from '@/screens/pause/lib/pause-science-step-highlight';

describe('stepHighlightsScienceRow', () => {
  it('highlights only the matching step', () => {
    expect(stepHighlightsScienceRow('feel', 'feel')).toBe(true);
    expect(stepHighlightsScienceRow('feel', 'breathe')).toBe(false);
    expect(stepHighlightsScienceRow(undefined, 'feel')).toBe(false);
  });
});
