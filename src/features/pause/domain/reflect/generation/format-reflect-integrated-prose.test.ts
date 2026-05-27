import { describe, expect, it } from 'vitest';
import { reflectionContentV2 } from './reflection-content-v2';
import { formatReflectIntegratedProse } from './format-reflect-integrated-prose';

describe('formatReflectIntegratedProse', () => {
  it('orders land, hypothesis, inquiry, and context strip without labels', () => {
    const content = reflectionContentV2({
      land: 'The move is sharp.',
      hypothesis: 'This might feel personal, not just statistical.',
      inquiry: 'What story are you telling yourself',
      contextStrip: 'Some traders watch flows; others notice their breath.',
    });
    const prose = formatReflectIntegratedProse(content);
    expect(prose).toContain('The move is sharp.');
    expect(prose).toContain('This might feel personal');
    expect(prose).toContain('What story are you telling yourself?');
    expect(prose).toContain('Some traders watch flows');
    expect(prose).not.toContain('Name it');
    expect(prose).not.toContain('You said:');
  });

  it('falls back to message when structured fields are empty', () => {
    const content = reflectionContentV2({
      land: '',
      hypothesis: '',
      inquiry: '',
      contextStrip: null,
    });
    const withMessage = { ...content, message: 'Legacy single paragraph.' };
    expect(formatReflectIntegratedProse(withMessage)).toBe('Legacy single paragraph.');
  });
});
